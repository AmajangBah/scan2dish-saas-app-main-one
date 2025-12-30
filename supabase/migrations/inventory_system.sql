-- Inventory system (ingredients + recipes + transaction-safe deduction)
-- Designed for: one authenticated user == one restaurant.

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  unit text not null, -- e.g. kg, g, pcs, l, ml
  current_quantity numeric(12,3) not null default 0,
  min_threshold numeric(12,3) not null default 0,
  cost_per_unit numeric(12,4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ingredients_name_nonempty check (char_length(trim(name)) > 0),
  constraint ingredients_qty_nonnegative check (current_quantity >= 0),
  constraint ingredients_min_nonnegative check (min_threshold >= 0)
);

create index if not exists idx_ingredients_restaurant_id on public.ingredients(restaurant_id);
create index if not exists idx_ingredients_low_stock on public.ingredients(restaurant_id, current_quantity, min_threshold);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_ingredients_set_updated_at'
  ) then
    create trigger trg_ingredients_set_updated_at
    before update on public.ingredients
    for each row execute function public.set_updated_at();
  end if;
end $$;

create table if not exists public.menu_item_ingredients (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  quantity_per_item numeric(12,3) not null, -- supports fractional quantities
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mii_qty_positive check (quantity_per_item > 0)
);

create unique index if not exists uq_mii_unique on public.menu_item_ingredients(menu_item_id, ingredient_id);
create index if not exists idx_mii_restaurant_id on public.menu_item_ingredients(restaurant_id);
create index if not exists idx_mii_menu_item_id on public.menu_item_ingredients(menu_item_id);
create index if not exists idx_mii_ingredient_id on public.menu_item_ingredients(ingredient_id);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_menu_item_ingredients_set_updated_at'
  ) then
    create trigger trg_menu_item_ingredients_set_updated_at
    before update on public.menu_item_ingredients
    for each row execute function public.set_updated_at();
  end if;
end $$;

create table if not exists public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  delta numeric(12,3) not null, -- negative = deduction
  reason text not null, -- 'order', 'restock', 'adjustment', 'kitchen'
  order_id uuid references public.orders(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_tx_restaurant_id_created_at on public.inventory_transactions(restaurant_id, created_at desc);
create index if not exists idx_inventory_tx_ingredient_id_created_at on public.inventory_transactions(ingredient_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Menu item stock flag (computed by triggers/functions)
-- -----------------------------------------------------------------------------

alter table public.menu_items
  add column if not exists inventory_out_of_stock boolean not null default false;

create index if not exists idx_menu_items_out_of_stock on public.menu_items(restaurant_id, inventory_out_of_stock);

-- -----------------------------------------------------------------------------
-- Functions: recompute out-of-stock flags
-- -----------------------------------------------------------------------------

create or replace function public.recompute_menu_item_out_of_stock(p_menu_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_restaurant_id uuid;
  v_has_recipe boolean;
  v_out boolean := false;
begin
  select restaurant_id into v_restaurant_id from public.menu_items where id = p_menu_item_id;
  if v_restaurant_id is null then
    return;
  end if;

  select exists(select 1 from public.menu_item_ingredients where menu_item_id = p_menu_item_id)
    into v_has_recipe;

  if not v_has_recipe then
    update public.menu_items
      set inventory_out_of_stock = false
      where id = p_menu_item_id;
    return;
  end if;

  -- Out of stock if ANY required ingredient is insufficient for one unit
  select exists(
    select 1
    from public.menu_item_ingredients mii
    join public.ingredients ing on ing.id = mii.ingredient_id
    where mii.menu_item_id = p_menu_item_id
      and ing.restaurant_id = v_restaurant_id
      and ing.current_quantity < mii.quantity_per_item
  ) into v_out;

  update public.menu_items
    set inventory_out_of_stock = coalesce(v_out, false)
    where id = p_menu_item_id;
end $$;

create or replace function public.recompute_out_of_stock_for_ingredient(p_ingredient_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
begin
  for rec in
    select distinct mii.menu_item_id
    from public.menu_item_ingredients mii
    where mii.ingredient_id = p_ingredient_id
  loop
    perform public.recompute_menu_item_out_of_stock(rec.menu_item_id);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Triggers: keep stock flags up-to-date
-- -----------------------------------------------------------------------------

create or replace function public.trg_on_ingredients_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recompute_out_of_stock_for_ingredient(coalesce(new.id, old.id));
  return coalesce(new, old);
end $$;

drop trigger if exists trg_ingredients_recompute_stock on public.ingredients;
create trigger trg_ingredients_recompute_stock
after insert or update of current_quantity on public.ingredients
for each row execute function public.trg_on_ingredients_change();

create or replace function public.trg_on_recipe_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recompute_menu_item_out_of_stock(coalesce(new.menu_item_id, old.menu_item_id));
  return coalesce(new, old);
end $$;

drop trigger if exists trg_recipe_recompute_stock on public.menu_item_ingredients;
create trigger trg_recipe_recompute_stock
after insert or update or delete on public.menu_item_ingredients
for each row execute function public.trg_on_recipe_change();

-- -----------------------------------------------------------------------------
-- Atomic order placement with inventory deduction
-- -----------------------------------------------------------------------------

create or replace function public.place_order_atomic(
  p_table_id uuid,
  p_items jsonb,
  p_customer_name text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_restaurant_id uuid;
  v_order_id uuid;
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_total numeric := 0;
  v_commission_rate numeric := 0.05;
  v_commission_amount numeric := 0;
  d record;
  applicable numeric;
  amt numeric;
  v_items_json jsonb;
begin
  -- Validate table
  select t.restaurant_id
    into v_restaurant_id
  from public.restaurant_tables t
  where t.id = p_table_id and t.is_active = true;

  if v_restaurant_id is null then
    raise exception 'TABLE_NOT_FOUND_OR_INACTIVE';
  end if;

  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'INVALID_ITEMS';
  end if;

  create temp table tmp_req(menu_item_id uuid, qty int) on commit drop;
  insert into tmp_req(menu_item_id, qty)
  select (x.value->>'id')::uuid, (x.value->>'qty')::int
  from jsonb_array_elements(p_items) as x(value);

  if exists(select 1 from tmp_req where qty is null or qty <= 0) then
    raise exception 'INVALID_QTY';
  end if;

  create temp table tmp_items(
    menu_item_id uuid,
    name text,
    price numeric,
    quantity int,
    category text
  ) on commit drop;

  insert into tmp_items(menu_item_id, name, price, quantity, category)
  select m.id, m.name, m.price, r.qty, m.category
  from tmp_req r
  join public.menu_items m on m.id = r.menu_item_id
  where m.restaurant_id = v_restaurant_id
    and m.available = true
    and coalesce(m.inventory_out_of_stock, false) = false;

  -- Ensure all requested items were loaded (exist + available + in stock)
  if (select count(*) from tmp_items) <> (select count(*) from tmp_req) then
    raise exception 'ITEM_UNAVAILABLE_OR_OUT_OF_STOCK';
  end if;

  select coalesce(sum(price * quantity), 0) into v_subtotal from tmp_items;

  -- Best discount (no stacking): choose highest savings
  v_discount := 0;
  for d in
    select *
    from public.discounts
    where restaurant_id = v_restaurant_id
      and is_active = true
      and (start_time is null or start_time <= now())
      and (end_time is null or end_time >= now())
  loop
    applicable := 0;
    if d.apply_to = 'all' then
      applicable := v_subtotal;
    elsif d.apply_to = 'category' and d.category_id is not null then
      select coalesce(sum(price * quantity), 0) into applicable
      from tmp_items
      where category = d.category_id;
    elsif d.apply_to = 'item' and d.item_id is not null then
      select coalesce(sum(price * quantity), 0) into applicable
      from tmp_items
      where menu_item_id = d.item_id;
    end if;

    if applicable > 0 then
      if d.discount_type = 'fixed' then
        amt := least(d.discount_value, applicable);
      else
        amt := least(applicable * (d.discount_value / 100.0), applicable);
      end if;
      if amt > v_discount then
        v_discount := amt;
      end if;
    end if;
  end loop;

  v_total := greatest(0, v_subtotal - v_discount);
  v_commission_amount := round(v_total * v_commission_rate, 2);

  -- Inventory check + deduction (atomic)
  create temp table tmp_needed(ingredient_id uuid, required numeric) on commit drop;
  insert into tmp_needed(ingredient_id, required)
  select mii.ingredient_id,
         sum(mii.quantity_per_item * ti.quantity) as required
  from public.menu_item_ingredients mii
  join tmp_items ti on ti.menu_item_id = mii.menu_item_id
  where mii.restaurant_id = v_restaurant_id
  group by mii.ingredient_id;

  -- Lock ingredient rows and ensure sufficient stock
  if exists(
    select 1
    from public.ingredients ing
    join tmp_needed n on n.ingredient_id = ing.id
    where ing.restaurant_id = v_restaurant_id
    for update
  ) then
    -- ok
  end if;

  if exists(
    select 1
    from public.ingredients ing
    join tmp_needed n on n.ingredient_id = ing.id
    where ing.restaurant_id = v_restaurant_id
      and ing.current_quantity < n.required
  ) then
    raise exception 'INSUFFICIENT_STOCK';
  end if;

  update public.ingredients ing
    set current_quantity = ing.current_quantity - n.required
  from tmp_needed n
  where ing.id = n.ingredient_id
    and ing.restaurant_id = v_restaurant_id;

  select jsonb_agg(
    jsonb_build_object(
      'menu_item_id', menu_item_id,
      'name', name,
      'price', price,
      'quantity', quantity
    )
  )
  into v_items_json
  from tmp_items;

  insert into public.orders(
    restaurant_id,
    table_id,
    items,
    subtotal,
    vat_amount,
    tip_amount,
    total,
    commission_rate,
    commission_amount,
    status,
    customer_name,
    notes
  ) values (
    v_restaurant_id,
    p_table_id,
    coalesce(v_items_json, '[]'::jsonb),
    v_subtotal,
    0,
    0,
    v_total,
    v_commission_rate,
    v_commission_amount,
    'pending',
    nullif(trim(p_customer_name), ''),
    nullif(trim(p_notes), '')
  )
  returning id into v_order_id;

  -- Log inventory deductions
  insert into public.inventory_transactions(restaurant_id, ingredient_id, delta, reason, order_id)
  select v_restaurant_id, ingredient_id, -required, 'order', v_order_id
  from tmp_needed
  where required <> 0;

  -- Recompute out-of-stock for impacted items
  for d in select menu_item_id from tmp_items loop
    perform public.recompute_menu_item_out_of_stock(d.menu_item_id);
  end loop;

  return v_order_id;
end $$;

-- Allow calling from anon/authenticated (kitchen/menu) safely
grant execute on function public.place_order_atomic(uuid, jsonb, text, text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

alter table public.ingredients enable row level security;
alter table public.menu_item_ingredients enable row level security;
alter table public.inventory_transactions enable row level security;

-- Ingredients: owner manage, kitchen/menu read not allowed by default
drop policy if exists ingredients_owner_all on public.ingredients;
create policy ingredients_owner_all
on public.ingredients
for all
to authenticated
using (
  exists (
    select 1 from public.restaurants r
    where r.id = ingredients.restaurant_id
      and r.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.restaurants r
    where r.id = ingredients.restaurant_id
      and r.user_id = auth.uid()
  )
);

-- Recipes: owner manage, public read (needed for menu to show stock state optionally)
drop policy if exists menu_item_ingredients_owner_all on public.menu_item_ingredients;
create policy menu_item_ingredients_owner_all
on public.menu_item_ingredients
for all
to authenticated
using (
  exists (
    select 1 from public.restaurants r
    where r.id = menu_item_ingredients.restaurant_id
      and r.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.restaurants r
    where r.id = menu_item_ingredients.restaurant_id
      and r.user_id = auth.uid()
  )
);

drop policy if exists menu_item_ingredients_public_select on public.menu_item_ingredients;
create policy menu_item_ingredients_public_select
on public.menu_item_ingredients
for select
to anon, authenticated
using (true);

-- Inventory transactions: owner read
drop policy if exists inventory_transactions_owner_select on public.inventory_transactions;
create policy inventory_transactions_owner_select
on public.inventory_transactions
for select
to authenticated
using (
  exists (
    select 1 from public.restaurants r
    where r.id = inventory_transactions.restaurant_id
      and r.user_id = auth.uid()
  )
);

