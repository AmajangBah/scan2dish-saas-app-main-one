-- Scan2Dish - Supabase schema (run in Supabase SQL editor)
-- Creates core tables + RLS policies aligned to current codebase usage.
--
-- Notes:
-- - Uses `auth.users` for authentication. `restaurants.user_id` references `auth.users(id)`.
-- - Customers are anonymous; they can validate a table and create an order via a table QR (UUID).
-- - Owners (authenticated) can manage their restaurant, tables, menu items, and orders.

-- Extensions (Supabase usually has pgcrypto enabled, but keep it explicit)
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum ('pending', 'preparing', 'completed', 'cancelled');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'table_status') then
    create type public.table_status as enum ('available', 'occupied');
  end if;
end $$;

-- Optional (currently mostly UI-mocked, but kept for forward-compat)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'discount_type') then
    create type public.discount_type as enum ('percentage', 'fixed', 'category', 'item', 'time');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'discount_apply_to') then
    create type public.discount_apply_to as enum ('all', 'category', 'item');
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- updated_at trigger helper
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- restaurants
-- -----------------------------------------------------------------------------
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  brand_color text not null default '#C84501',
  currency text not null default 'GMD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint restaurants_currency_check check (currency in ('USD', 'EUR', 'GBP', 'GMD', 'XOF', 'NGN', 'GHS', 'ZAR', 'KES'))
);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_restaurants_set_updated_at'
  ) then
    create trigger trg_restaurants_set_updated_at
    before update on public.restaurants
    for each row execute function public.set_updated_at();
  end if;
end $$;

create index if not exists idx_restaurants_user_id on public.restaurants(user_id);

-- -----------------------------------------------------------------------------
-- restaurant_tables
-- -----------------------------------------------------------------------------
create table if not exists public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_number text not null,
  is_active boolean not null default true,
  capacity integer,
  location text,
  status public.table_status not null default 'available',
  qr_assigned boolean not null default false,
  qr_scans integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint restaurant_tables_unique_number unique (restaurant_id, table_number),
  constraint restaurant_tables_qr_scans_nonnegative check (qr_scans >= 0),
  constraint restaurant_tables_capacity_positive check (capacity is null or capacity > 0)
);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_restaurant_tables_set_updated_at'
  ) then
    create trigger trg_restaurant_tables_set_updated_at
    before update on public.restaurant_tables
    for each row execute function public.set_updated_at();
  end if;
end $$;

create index if not exists idx_restaurant_tables_restaurant_id on public.restaurant_tables(restaurant_id);
create index if not exists idx_restaurant_tables_is_active on public.restaurant_tables(is_active);

-- -----------------------------------------------------------------------------
-- menu_items
-- -----------------------------------------------------------------------------
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  description text not null default '',
  -- Optional per-locale overrides for customer menu.
  -- Example: {"fr":"Poulet Yassa","es":"Pollo Yassa"}
  name_translations jsonb not null default '{}'::jsonb,
  description_translations jsonb not null default '{}'::jsonb,
  category text,
  price numeric(10,2) not null,
  images text[] not null default '{}'::text[],
  available boolean not null default true,
  -- Mirrors UI shape in `app/dashboard/menu/types.ts` (but kept flexible)
  tags jsonb not null default '{"spicy":false,"vegetarian":false,"glutenFree":false}'::jsonb,
  variants jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menu_items_price_nonnegative check (price >= 0),
  constraint menu_items_name_translations_is_object check (jsonb_typeof(name_translations) = 'object'),
  constraint menu_items_description_translations_is_object check (jsonb_typeof(description_translations) = 'object'),
  constraint menu_items_tags_is_object check (jsonb_typeof(tags) = 'object'),
  constraint menu_items_variants_is_array check (jsonb_typeof(variants) = 'array')
);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_menu_items_set_updated_at'
  ) then
    create trigger trg_menu_items_set_updated_at
    before update on public.menu_items
    for each row execute function public.set_updated_at();
  end if;
end $$;

create index if not exists idx_menu_items_restaurant_id on public.menu_items(restaurant_id);
create index if not exists idx_menu_items_available on public.menu_items(available);

-- -----------------------------------------------------------------------------
-- orders
-- -----------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_id uuid not null references public.restaurant_tables(id) on delete restrict,
  items jsonb not null, -- array of {menu_item_id, name, price, quantity}
  subtotal numeric(10,2) not null,
  vat_amount numeric(10,2) not null,
  tip_amount numeric(10,2) not null,
  total numeric(10,2) not null,
  commission_rate numeric(5,4) not null default 0.05,
  commission_amount numeric(10,2) not null,
  status public.order_status not null default 'pending',
  customer_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_items_is_array check (jsonb_typeof(items) = 'array'),
  constraint orders_subtotal_nonnegative check (subtotal >= 0),
  constraint orders_vat_nonnegative check (vat_amount >= 0),
  constraint orders_tip_nonnegative check (tip_amount >= 0),
  constraint orders_total_nonnegative check (total >= 0),
  constraint orders_commission_rate_range check (commission_rate >= 0 and commission_rate <= 1),
  constraint orders_commission_amount_nonnegative check (commission_amount >= 0)
);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_orders_set_updated_at'
  ) then
    create trigger trg_orders_set_updated_at
    before update on public.orders
    for each row execute function public.set_updated_at();
  end if;
end $$;

create index if not exists idx_orders_restaurant_id_created_at on public.orders(restaurant_id, created_at desc);
create index if not exists idx_orders_table_id_created_at on public.orders(table_id, created_at desc);
create index if not exists idx_orders_status on public.orders(status);

-- -----------------------------------------------------------------------------
-- discounts (optional / forward compatible)
-- -----------------------------------------------------------------------------
create table if not exists public.discounts (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  discount_type public.discount_type not null,
  discount_value numeric(10,2) not null,
  apply_to public.discount_apply_to not null default 'all',
  category_id text,
  item_id uuid references public.menu_items(id) on delete set null,
  start_time timestamptz,
  end_time timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discounts_value_nonnegative check (discount_value >= 0),
  constraint discounts_time_range_valid check (
    start_time is null or end_time is null or start_time <= end_time
  )
);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_discounts_set_updated_at'
  ) then
    create trigger trg_discounts_set_updated_at
    before update on public.discounts
    for each row execute function public.set_updated_at();
  end if;
end $$;

create index if not exists idx_discounts_restaurant_id on public.discounts(restaurant_id);
create index if not exists idx_discounts_is_active on public.discounts(is_active);

-- -----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- -----------------------------------------------------------------------------
alter table public.restaurants enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.discounts enable row level security;

-- Restaurants:
-- - public can read via active tables (needed for `/menu/[tableId]` customer ordering)
-- - owners can CRUD their own restaurants
drop policy if exists restaurants_public_select on public.restaurants;
create policy restaurants_public_select
on public.restaurants
for select
to anon, authenticated
using (
  -- Public can only read restaurants linked to active tables they're trying to access
  -- This is enforced via the join in the menu layout, not in RLS itself
  true
);

drop policy if exists restaurants_select_own on public.restaurants;
create policy restaurants_select_own
on public.restaurants
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists restaurants_insert_own on public.restaurants;
create policy restaurants_insert_own
on public.restaurants
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists restaurants_update_own on public.restaurants;
create policy restaurants_update_own
on public.restaurants
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists restaurants_delete_own on public.restaurants;
create policy restaurants_delete_own
on public.restaurants
for delete
to authenticated
using (auth.uid() = user_id);

-- Restaurant tables:
-- - public can read active tables (needed for `/menu/[tableId]` validation)
-- - owners can manage their tables
drop policy if exists restaurant_tables_public_select_active on public.restaurant_tables;
create policy restaurant_tables_public_select_active
on public.restaurant_tables
for select
to anon, authenticated
using (is_active = true);

drop policy if exists restaurant_tables_owner_all on public.restaurant_tables;
create policy restaurant_tables_owner_all
on public.restaurant_tables
for all
to authenticated
using (
  exists (
    select 1
    from public.restaurants r
    where r.id = restaurant_tables.restaurant_id
      and r.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.restaurants r
    where r.id = restaurant_tables.restaurant_id
      and r.user_id = auth.uid()
  )
);

-- Menu items:
-- - public can read (needed for customer menu + order price validation)
-- - owners can manage
drop policy if exists menu_items_public_select on public.menu_items;
create policy menu_items_public_select
on public.menu_items
for select
to anon, authenticated
using (true);

drop policy if exists menu_items_owner_all on public.menu_items;
create policy menu_items_owner_all
on public.menu_items
for all
to authenticated
using (
  exists (
    select 1
    from public.restaurants r
    where r.id = menu_items.restaurant_id
      and r.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.restaurants r
    where r.id = menu_items.restaurant_id
      and r.user_id = auth.uid()
  )
);

-- Orders:
-- - public can INSERT orders, but only for an active table and coherent restaurant_id
-- - owners can read/update/delete orders for their restaurant
drop policy if exists orders_public_insert_for_active_table on public.orders;
create policy orders_public_insert_for_active_table
on public.orders
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.restaurant_tables t
    where t.id = orders.table_id
      and t.is_active = true
      and t.restaurant_id = orders.restaurant_id
  )
);

drop policy if exists orders_owner_select on public.orders;
create policy orders_owner_select
on public.orders
for select
to authenticated
using (
  exists (
    select 1
    from public.restaurants r
    where r.id = orders.restaurant_id
      and r.user_id = auth.uid()
  )
);

drop policy if exists orders_owner_update on public.orders;
create policy orders_owner_update
on public.orders
for update
to authenticated
using (
  exists (
    select 1
    from public.restaurants r
    where r.id = orders.restaurant_id
      and r.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.restaurants r
    where r.id = orders.restaurant_id
      and r.user_id = auth.uid()
  )
);

drop policy if exists orders_owner_delete on public.orders;
create policy orders_owner_delete
on public.orders
for delete
to authenticated
using (
  exists (
    select 1
    from public.restaurants r
    where r.id = orders.restaurant_id
      and r.user_id = auth.uid()
  )
);

-- Discounts (owner only for now)
drop policy if exists discounts_owner_all on public.discounts;
create policy discounts_owner_all
on public.discounts
for all
to authenticated
using (
  exists (
    select 1
    from public.restaurants r
    where r.id = discounts.restaurant_id
      and r.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.restaurants r
    where r.id = discounts.restaurant_id
      and r.user_id = auth.uid()
  )
);

-- Allow customers (anon) to read active discounts for menu pricing display.
-- This is safe because discounts are promotional and intended to be public.
drop policy if exists discounts_public_read_active on public.discounts;
create policy discounts_public_read_active
on public.discounts
for select
to anon, authenticated
using (
  is_active = true
  and (start_time is null or start_time <= now())
  and (end_time is null or end_time >= now())
);

-- -----------------------------------------------------------------------------
-- onboarding_progress
-- -----------------------------------------------------------------------------
create table if not exists public.onboarding_progress (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null unique references public.restaurants(id) on delete cascade,
  current_step integer not null default 1,
  completed boolean not null default false,
  steps_completed jsonb not null default '[]'::jsonb,
  skipped boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint onboarding_progress_step_range check (current_step between 1 and 7),
  constraint onboarding_progress_steps_is_array check (jsonb_typeof(steps_completed) = 'array')
);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_onboarding_progress_set_updated_at'
  ) then
    create trigger trg_onboarding_progress_set_updated_at
    before update on public.onboarding_progress
    for each row execute function public.set_updated_at();
  end if;
end $$;

create index if not exists idx_onboarding_progress_restaurant_id on public.onboarding_progress(restaurant_id);

alter table public.onboarding_progress enable row level security;

drop policy if exists onboarding_progress_owner_all on public.onboarding_progress;
create policy onboarding_progress_owner_all
on public.onboarding_progress
for all
to authenticated
using (
  exists (
    select 1
    from public.restaurants r
    where r.id = onboarding_progress.restaurant_id
      and r.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.restaurants r
    where r.id = onboarding_progress.restaurant_id
      and r.user_id = auth.uid()
  )
);


