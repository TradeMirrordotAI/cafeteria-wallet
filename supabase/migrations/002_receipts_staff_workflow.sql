-- CampusBite operational fields for a school pilot.
-- Apply after 001_initial_schema.sql. Review portal SSO and RLS policies before production.

alter table public.orders
  add column if not exists receipt_number text,
  add column if not exists payment_reference text,
  add column if not exists student_name_snapshot text,
  add column if not exists student_number_snapshot text,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists orders_receipt_number_unique
  on public.orders(receipt_number) where receipt_number is not null;

create index if not exists orders_status_created_idx
  on public.orders(status, created_at desc);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  event_type text not null check (event_type in ('created','payment_confirmed','preparing','ready','collected','refunded','cancelled')),
  actor_id uuid,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists order_events_order_created_idx
  on public.order_events(order_id, created_at desc);

alter table public.order_events enable row level security;

-- No direct client write policies are added intentionally. Record events through
-- trusted server-side functions after checking the caller's portal-derived role.
-- Do not allow a browser to mark an order collected or to create receipt numbers.
