-- =============================================================================
-- Scan2Dish: SaaS Admin System Migration
-- =============================================================================
-- This migration creates the complete admin infrastructure for managing
-- restaurants, commission tracking, payments, and enforcement.

-- -----------------------------------------------------------------------------
-- 1. ADMIN USERS TABLE
-- -----------------------------------------------------------------------------
-- Admins are separate from restaurant owners and have full platform access
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null default 'admin' check (role in ('super_admin', 'admin', 'support')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create index if not exists idx_admin_users_user_id on public.admin_users(user_id);
create index if not exists idx_admin_users_is_active on public.admin_users(is_active);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_admin_users_set_updated_at'
  ) then
    create trigger trg_admin_users_set_updated_at
    before update on public.admin_users
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 2. RESTAURANT ENFORCEMENT FIELDS
-- -----------------------------------------------------------------------------
-- Add fields to restaurants table for menu enforcement and payment tracking
alter table public.restaurants
  add column if not exists menu_enabled boolean not null default true,
  add column if not exists enforcement_reason text,
  add column if not exists last_payment_date timestamptz,
  add column if not exists total_commission_owed numeric(10,2) not null default 0,
  add column if not exists total_commission_paid numeric(10,2) not null default 0,
  add column if not exists commission_rate numeric(5,4) not null default 0.05;

create index if not exists idx_restaurants_menu_enabled on public.restaurants(menu_enabled);

-- -----------------------------------------------------------------------------
-- 3. COMMISSION PAYMENTS TABLE
-- -----------------------------------------------------------------------------
-- Track all commission payments (manual and automated)
create table if not exists public.commission_payments (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('cash', 'bank_transfer', 'mobile_money', 'other')),
  payment_date timestamptz not null default now(),
  reference_number text,
  notes text,
  recorded_by uuid not null references public.admin_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_commission_payments_restaurant_id on public.commission_payments(restaurant_id);
create index if not exists idx_commission_payments_payment_date on public.commission_payments(payment_date desc);
create index if not exists idx_commission_payments_recorded_by on public.commission_payments(recorded_by);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_commission_payments_set_updated_at'
  ) then
    create trigger trg_commission_payments_set_updated_at
    before update on public.commission_payments
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 4. ADMIN ACTIVITY LOGS
-- -----------------------------------------------------------------------------
-- Track all admin actions for audit trail
create table if not exists public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admin_users(id) on delete cascade,
  action_type text not null check (action_type in (
    'restaurant_enabled', 'restaurant_disabled', 'menu_enabled', 'menu_disabled',
    'payment_recorded', 'commission_adjusted', 'restaurant_viewed',
    'order_viewed', 'settings_changed'
  )),
  restaurant_id uuid references public.restaurants(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_activity_logs_admin_id on public.admin_activity_logs(admin_id);
create index if not exists idx_admin_activity_logs_restaurant_id on public.admin_activity_logs(restaurant_id);
create index if not exists idx_admin_activity_logs_action_type on public.admin_activity_logs(action_type);
create index if not exists idx_admin_activity_logs_created_at on public.admin_activity_logs(created_at desc);

-- -----------------------------------------------------------------------------
-- 5. HELPER FUNCTIONS
-- -----------------------------------------------------------------------------

-- Function to check if user is admin
create or replace function public.is_admin(user_uuid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = user_uuid
      and is_active = true
  );
$$;

-- Function to get restaurant status for enforcement
create or replace function public.get_restaurant_status(rest_id uuid)
returns table (
  id uuid,
  name text,
  menu_enabled boolean,
  enforcement_reason text,
  total_orders bigint,
  total_revenue numeric,
  commission_owed numeric,
  commission_paid numeric,
  commission_balance numeric
)
language plpgsql
security definer
stable
as $$
begin
  return query
  select
    r.id,
    r.name,
    r.menu_enabled,
    r.enforcement_reason,
    count(o.id) as total_orders,
    coalesce(sum(o.total), 0) as total_revenue,
    r.total_commission_owed,
    r.total_commission_paid,
    (r.total_commission_owed - r.total_commission_paid) as commission_balance
  from public.restaurants r
  left join public.orders o on o.restaurant_id = r.id
  where r.id = rest_id
  group by r.id;
end;
$$;

-- Function to update commission totals (call after order creation)
create or replace function public.update_restaurant_commission()
returns trigger
language plpgsql
security definer
as $$
begin
  if TG_OP = 'INSERT' then
    update public.restaurants
    set total_commission_owed = total_commission_owed + NEW.commission_amount
    where id = NEW.restaurant_id;
  elsif TG_OP = 'UPDATE' then
    update public.restaurants
    set total_commission_owed = total_commission_owed - OLD.commission_amount + NEW.commission_amount
    where id = NEW.restaurant_id;
  elsif TG_OP = 'DELETE' then
    update public.restaurants
    set total_commission_owed = total_commission_owed - OLD.commission_amount
    where id = OLD.restaurant_id;
  end if;
  return NEW;
end;
$$;

-- Trigger to auto-update commission totals on orders
drop trigger if exists trg_orders_update_commission on public.orders;
create trigger trg_orders_update_commission
after insert or update or delete on public.orders
for each row execute function public.update_restaurant_commission();

-- Function to record payment and update restaurant totals
create or replace function public.record_commission_payment(
  rest_id uuid,
  pay_amount numeric,
  pay_method text,
  pay_reference text,
  pay_notes text,
  admin_id uuid
)
returns uuid
language plpgsql
security definer
as $$
declare
  payment_id uuid;
begin
  -- Insert payment record
  insert into public.commission_payments (
    restaurant_id,
    amount,
    payment_method,
    reference_number,
    notes,
    recorded_by
  ) values (
    rest_id,
    pay_amount,
    pay_method,
    pay_reference,
    pay_notes,
    admin_id
  ) returning id into payment_id;

  -- Update restaurant totals
  update public.restaurants
  set
    total_commission_paid = total_commission_paid + pay_amount,
    last_payment_date = now()
  where id = rest_id;

  return payment_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------

-- Enable RLS on new tables
alter table public.admin_users enable row level security;
alter table public.commission_payments enable row level security;
alter table public.admin_activity_logs enable row level security;

-- Admin users: only admins can manage admins
drop policy if exists admin_users_admin_all on public.admin_users;
create policy admin_users_admin_all
on public.admin_users
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Commission payments: admins can view/manage all
drop policy if exists commission_payments_admin_all on public.commission_payments;
create policy commission_payments_admin_all
on public.commission_payments
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Activity logs: admins can view all, insert their own
drop policy if exists admin_activity_logs_admin_select on public.admin_activity_logs;
create policy admin_activity_logs_admin_select
on public.admin_activity_logs
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists admin_activity_logs_admin_insert on public.admin_activity_logs;
create policy admin_activity_logs_admin_insert
on public.admin_activity_logs
for insert
to authenticated
with check (public.is_admin(auth.uid()));

-- Update existing RLS policies to allow admin access to all data

-- Restaurants: add admin access
drop policy if exists restaurants_admin_all on public.restaurants;
create policy restaurants_admin_all
on public.restaurants
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Restaurant tables: add admin read access
drop policy if exists restaurant_tables_admin_select on public.restaurant_tables;
create policy restaurant_tables_admin_select
on public.restaurant_tables
for select
to authenticated
using (public.is_admin(auth.uid()));

-- Menu items: add admin access
drop policy if exists menu_items_admin_all on public.menu_items;
create policy menu_items_admin_all
on public.menu_items
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Orders: add admin access
drop policy if exists orders_admin_all on public.orders;
create policy orders_admin_all
on public.orders
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Discounts: add admin access
drop policy if exists discounts_admin_all on public.discounts;
create policy discounts_admin_all
on public.discounts
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Onboarding progress: add admin access
drop policy if exists onboarding_progress_admin_all on public.onboarding_progress;
create policy onboarding_progress_admin_all
on public.onboarding_progress
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- 7. VIEWS FOR ADMIN DASHBOARD
-- -----------------------------------------------------------------------------

-- Create materialized view for fast dashboard metrics
create materialized view if not exists public.admin_dashboard_metrics as
select
  -- Restaurant metrics
  count(distinct r.id) as total_restaurants,
  count(distinct r.id) filter (where r.menu_enabled = true) as active_restaurants,
  count(distinct r.id) filter (where r.menu_enabled = false) as disabled_restaurants,
  
  -- Order metrics
  count(distinct o.id) as total_orders,
  count(distinct o.id) filter (where o.created_at > now() - interval '24 hours') as orders_last_24h,
  count(distinct o.id) filter (where o.created_at > now() - interval '7 days') as orders_last_7d,
  count(distinct o.id) filter (where o.created_at > now() - interval '30 days') as orders_last_30d,
  
  -- Revenue metrics
  coalesce(sum(o.total), 0) as total_revenue,
  coalesce(sum(o.total) filter (where o.created_at > now() - interval '24 hours'), 0) as revenue_last_24h,
  coalesce(sum(o.total) filter (where o.created_at > now() - interval '7 days'), 0) as revenue_last_7d,
  coalesce(sum(o.total) filter (where o.created_at > now() - interval '30 days'), 0) as revenue_last_30d,
  
  -- Commission metrics
  coalesce(sum(o.commission_amount), 0) as total_commission_generated,
  coalesce(sum(o.commission_amount) filter (where o.created_at > now() - interval '30 days'), 0) as commission_last_30d,
  coalesce(sum(r.total_commission_owed), 0) as total_commission_owed,
  coalesce(sum(r.total_commission_paid), 0) as total_commission_paid,
  coalesce(sum(r.total_commission_owed - r.total_commission_paid), 0) as commission_outstanding
  
from public.restaurants r
left join public.orders o on o.restaurant_id = r.id;

-- Create index on materialized view
create unique index if not exists idx_admin_dashboard_metrics_single_row
on public.admin_dashboard_metrics ((1));

-- Grant access to authenticated users (will be restricted by RLS on underlying tables)
grant select on public.admin_dashboard_metrics to authenticated;

-- Function to refresh dashboard metrics
create or replace function public.refresh_admin_dashboard_metrics()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view concurrently public.admin_dashboard_metrics;
end;
$$;

-- -----------------------------------------------------------------------------
-- NOTES
-- -----------------------------------------------------------------------------
-- After running this migration:
-- 1. Create your first admin user via Supabase Auth
-- 2. Insert a record in admin_users linking to that auth.users record
-- 3. Use the admin dashboard to manage restaurants and commission
-- 4. The enforcement logic will check r.menu_enabled before showing menus
