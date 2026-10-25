-- CampusBite starter schema.
-- Run in Supabase SQL Editor. Review policies before production launch.

create extension if not exists pgcrypto;

create type public.app_role as enum ('student', 'cafeteria', 'admin');
create type public.order_status as enum ('paid', 'preparing', 'ready', 'collected');
create type public.wallet_tx_type as enum ('topup', 'purchase', 'refund', 'adjustment');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  student_number text unique,
  role public.app_role not null default 'student',
  created_at timestamptz not null default now()
);

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  balance_kobo bigint not null default 0 check (balance_kobo >= 0),
  created_at timestamptz not null default now()
);

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id),
  type public.wallet_tx_type not null,
  amount_kobo bigint not null check (amount_kobo > 0),
  reference text unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null default 'Meals',
  price_kobo bigint not null check (price_kobo > 0),
  emoji text not null default '🍽️',
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  collection_code text not null unique,
  status public.order_status not null default 'paid',
  total_kobo bigint not null check (total_kobo > 0),
  created_at timestamptz not null default now(),
  collected_at timestamptz
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id),
  item_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price_kobo bigint not null check (unit_price_kobo > 0)
);

create index orders_user_created_idx on public.orders(user_id, created_at desc);
create index orders_code_idx on public.orders(collection_code);
create index wallet_transactions_wallet_created_idx on public.wallet_transactions(wallet_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Profiles: users can read/update their own basic profile.
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Students can read their own wallet and transactions only.
create policy "wallets_select_own" on public.wallets for select to authenticated using (user_id = auth.uid());
create policy "wallet_tx_select_own" on public.wallet_transactions for select to authenticated
using (exists (select 1 from public.wallets w where w.id = wallet_id and w.user_id = auth.uid()));

-- Menu is visible to signed-in users. Management writes will be restricted through server-side admin operations.
create policy "menu_read_authenticated" on public.menu_items for select to authenticated using (true);

-- Students can read their own orders and their order items.
create policy "orders_select_own" on public.orders for select to authenticated using (user_id = auth.uid());
create policy "order_items_select_own" on public.order_items for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- Intentionally no client-side insert/update policies for wallets, ledger, orders or order items.
-- Implement trusted Edge Functions/RPCs for payment webhooks, wallet debits and collection redemption.
-- Do not expose the Supabase service-role key in the browser.
