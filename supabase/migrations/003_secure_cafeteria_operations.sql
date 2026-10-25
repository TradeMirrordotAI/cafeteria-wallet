-- Secure operational RPCs for CampusBite.
-- Apply only after reviewing portal identity provisioning and assigning staff roles.
create or replace function public.current_app_role()
returns public.app_role
language sql stable security definer
set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.is_cafeteria_staff()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce(public.current_app_role() in ('cafeteria','admin'), false) $$;

-- Staff may see operational orders; students remain restricted to their own orders.
drop policy if exists orders_select_own on public.orders;
create policy orders_select_own_or_staff on public.orders for select to authenticated
using (user_id = auth.uid() or public.is_cafeteria_staff());
drop policy if exists order_items_select_own on public.order_items;
create policy order_items_select_own_or_staff on public.order_items for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_cafeteria_staff())));
create policy order_events_select_own_or_staff on public.order_events for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_cafeteria_staff())));

-- Wallet checkout. Prices are always read from the database, never from browser payloads.
create or replace function public.place_cafeteria_order(p_items jsonb)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid(); v_wallet public.wallets%rowtype; v_order public.orders%rowtype;
  v_total bigint := 0; v_code text; v_receipt text; v_item jsonb; v_menu public.menu_items%rowtype;
  v_qty integer; v_name text; v_student_no text;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Cart is empty'; end if;
  if jsonb_array_length(p_items) > 30 then raise exception 'Too many distinct items'; end if;
  select * into v_wallet from public.wallets where user_id = v_user for update;
  if not found then raise exception 'Wallet not found'; end if;
  select full_name, student_number into v_name, v_student_no from public.profiles where id = v_user;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::integer;
    if v_qty < 1 or v_qty > 50 then raise exception 'Invalid quantity'; end if;
    select * into v_menu from public.menu_items where id = (v_item->>'menu_item_id')::uuid and is_available = true;
    if not found then raise exception 'A selected menu item is unavailable'; end if;
    v_total := v_total + (v_menu.price_kobo * v_qty);
  end loop;
  if v_wallet.balance_kobo < v_total then raise exception 'Insufficient wallet balance'; end if;

  v_code := 'CB-' || upper(substr(encode(gen_random_bytes(6),'hex'),1,8));
  v_receipt := 'CBR-' || to_char(now(),'YYYY') || '-' || upper(substr(encode(gen_random_bytes(5),'hex'),1,8));
  insert into public.orders(user_id, collection_code, receipt_number, payment_reference, student_name_snapshot, student_number_snapshot, status, total_kobo)
  values(v_user, v_code, v_receipt, 'WALLET-' || gen_random_uuid()::text, v_name, v_student_no, 'paid', v_total) returning * into v_order;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::integer;
    select * into v_menu from public.menu_items where id = (v_item->>'menu_item_id')::uuid;
    insert into public.order_items(order_id, menu_item_id, item_name, quantity, unit_price_kobo)
    values(v_order.id, v_menu.id, v_menu.name, v_qty, v_menu.price_kobo);
  end loop;
  update public.wallets set balance_kobo = balance_kobo - v_total where id = v_wallet.id;
  insert into public.wallet_transactions(wallet_id, type, amount_kobo, reference, description)
  values(v_wallet.id, 'purchase', v_total, 'ORDER-' || v_order.id::text, 'CampusBite order ' || v_receipt);
  insert into public.order_events(order_id, event_type, actor_id, note)
  values(v_order.id, 'created', v_user, 'Wallet checkout completed');
  return jsonb_build_object('order_id',v_order.id,'collection_code',v_code,'receipt_number',v_receipt,'total_kobo',v_total,'status','paid');
end; $$;

-- Atomic staff status transitions; collected orders cannot be collected twice.
create or replace function public.advance_cafeteria_order(p_order_id uuid, p_status public.order_status)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_order public.orders%rowtype; v_event text;
begin
  if auth.uid() is null or not public.is_cafeteria_staff() then raise exception 'Staff access required'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.status = 'collected' then raise exception 'Order has already been collected'; end if;
  if p_status = 'preparing' and v_order.status <> 'paid' then raise exception 'Only paid orders can be prepared'; end if;
  if p_status = 'ready' and v_order.status <> 'preparing' then raise exception 'Only preparing orders can be marked ready'; end if;
  if p_status = 'collected' and v_order.status <> 'ready' then raise exception 'Only ready orders can be collected'; end if;
  if p_status = 'paid' then raise exception 'Invalid status transition'; end if;
  update public.orders set status = p_status, collected_at = case when p_status='collected' then now() else collected_at end, updated_at=now() where id=p_order_id returning * into v_order;
  v_event := case p_status when 'preparing' then 'preparing' when 'ready' then 'ready' else 'collected' end;
  insert into public.order_events(order_id,event_type,actor_id) values(p_order_id,v_event,auth.uid());
  return jsonb_build_object('order_id',v_order.id,'status',v_order.status,'collected_at',v_order.collected_at);
end; $$;

-- Payment webhook-only wallet credit. Invoke from a verified Paystack webhook using service role;
-- this function is not executable by anon/authenticated clients.
create or replace function public.credit_wallet_from_verified_payment(p_student_id uuid, p_amount_kobo bigint, p_reference text)
returns void language plpgsql security definer set search_path = public
as $$
declare v_wallet public.wallets%rowtype;
begin
  if p_amount_kobo <= 0 or p_reference is null or length(trim(p_reference)) < 8 then raise exception 'Invalid payment details'; end if;
  if exists(select 1 from public.wallet_transactions where reference=p_reference) then return; end if;
  select * into v_wallet from public.wallets where user_id=p_student_id for update;
  if not found then raise exception 'Wallet not found'; end if;
  update public.wallets set balance_kobo=balance_kobo+p_amount_kobo where id=v_wallet.id;
  insert into public.wallet_transactions(wallet_id,type,amount_kobo,reference,description)
  values(v_wallet.id,'topup',p_amount_kobo,p_reference,'Verified payment wallet funding');
end; $$;

revoke all on function public.place_cafeteria_order(jsonb) from public, anon;
grant execute on function public.place_cafeteria_order(jsonb) to authenticated;
revoke all on function public.advance_cafeteria_order(uuid, public.order_status) from public, anon;
grant execute on function public.advance_cafeteria_order(uuid, public.order_status) to authenticated;
revoke all on function public.credit_wallet_from_verified_payment(uuid,bigint,text) from public, anon, authenticated;
grant execute on function public.credit_wallet_from_verified_payment(uuid,bigint,text) to service_role;

-- A user must never promote themselves to cafeteria/admin by editing their profile.
drop policy if exists profiles_update_own on public.profiles;
-- Profile names/student numbers are provisioned and maintained by the trusted portal integration.
create policy menu_admin_manage on public.menu_items for all to authenticated
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');
