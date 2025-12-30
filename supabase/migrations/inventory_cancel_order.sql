-- Atomic order cancellation with inventory rollback.
-- Restores ingredient quantities and logs a compensating inventory transaction.

create or replace function public.cancel_order_atomic(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_restaurant_id uuid;
  v_status public.order_status;
  v_items jsonb;
  rec record;
begin
  -- Lock the order row
  select restaurant_id, status, items
    into v_restaurant_id, v_status, v_items
  from public.orders
  where id = p_order_id
  for update;

  if v_restaurant_id is null then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  -- Owner-only: ensure current user owns the restaurant
  if not exists (
    select 1 from public.restaurants r
    where r.id = v_restaurant_id
      and r.user_id = auth.uid()
  ) then
    raise exception 'UNAUTHORIZED';
  end if;

  -- Idempotency
  if v_status = 'cancelled' then
    return;
  end if;

  if v_status = 'completed' then
    raise exception 'CANNOT_CANCEL_COMPLETED';
  end if;

  if jsonb_typeof(v_items) <> 'array' then
    raise exception 'INVALID_ITEMS';
  end if;

  create temp table tmp_order_items(menu_item_id uuid, qty int) on commit drop;
  insert into tmp_order_items(menu_item_id, qty)
  select
    (coalesce(x.value->>'menu_item_id', x.value->>'id'))::uuid,
    coalesce((x.value->>'quantity')::int, (x.value->>'qty')::int, 1)
  from jsonb_array_elements(v_items) as x(value);

  create temp table tmp_needed(ingredient_id uuid, required numeric) on commit drop;
  insert into tmp_needed(ingredient_id, required)
  select mii.ingredient_id,
         sum(mii.quantity_per_item * oi.qty) as required
  from tmp_order_items oi
  join public.menu_item_ingredients mii on mii.menu_item_id = oi.menu_item_id
  where mii.restaurant_id = v_restaurant_id
  group by mii.ingredient_id;

  -- Lock ingredient rows that will be adjusted
  perform 1
  from public.ingredients ing
  join tmp_needed n on n.ingredient_id = ing.id
  where ing.restaurant_id = v_restaurant_id
  for update;

  -- Restore stock
  update public.ingredients ing
    set current_quantity = ing.current_quantity + n.required
  from tmp_needed n
  where ing.id = n.ingredient_id
    and ing.restaurant_id = v_restaurant_id;

  -- Log inventory reversal
  insert into public.inventory_transactions(restaurant_id, ingredient_id, delta, reason, order_id, note)
  select v_restaurant_id, ingredient_id, required, 'order_cancel', p_order_id, 'Order cancelled'
  from tmp_needed
  where required <> 0;

  -- Update status
  update public.orders
    set status = 'cancelled'
  where id = p_order_id;

  -- Recompute out-of-stock for impacted menu items (also handled by triggers, but explicit is fine)
  for rec in (select distinct menu_item_id from tmp_order_items) loop
    perform public.recompute_menu_item_out_of_stock(rec.menu_item_id);
  end loop;
end $$;

grant execute on function public.cancel_order_atomic(uuid) to authenticated;

