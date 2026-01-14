import { requireRestaurantPage } from "@/lib/auth/restaurant";
import { createServerSupabase } from "@/lib/supabase/server";
import InventoryClient from "./InventoryClient";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const ctx = await requireRestaurantPage();
  const supabase = await createServerSupabase();
  const restaurantId = ctx.restaurant.id;

  const { data: ingredients } = await supabase
    .from("ingredients")
    .select(
      "id, name, unit, current_quantity, min_threshold, cost_per_unit, created_at"
    )
    .eq("restaurant_id", restaurantId)
    .order("name", { ascending: true });

  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("id, name, category, available, inventory_out_of_stock")
    .eq("restaurant_id", restaurantId)
    .order("name", { ascending: true });

  const { data: recipeRows } = await supabase
    .from("menu_item_ingredients")
    .select("menu_item_id, ingredient_id, quantity_per_item")
    .eq("restaurant_id", restaurantId);

  const { data: tx } = await supabase
    .from("inventory_transactions")
    .select("id, ingredient_id, delta, reason, order_id, note, created_at")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(60);

  return (
    <InventoryClient
      restaurantId={restaurantId}
      ingredients={(ingredients ?? []).map((i) => ({
        id: String(i.id),
        name: String(i.name),
        unit: String(i.unit),
        current_quantity: Number(i.current_quantity ?? 0),
        min_threshold: Number(i.min_threshold ?? 0),
        cost_per_unit: i.cost_per_unit == null ? null : Number(i.cost_per_unit),
      }))}
      menuItems={(menuItems ?? []).map((m) => ({
        id: String(m.id),
        name: String(m.name),
        category: m.category ? String(m.category) : null,
        available: Boolean(m.available),
        inventory_out_of_stock: Boolean(
          (m as { inventory_out_of_stock?: unknown }).inventory_out_of_stock
        ),
      }))}
      recipeRows={(recipeRows ?? []).map((r) => ({
        menu_item_id: String(r.menu_item_id),
        ingredient_id: String(r.ingredient_id),
        quantity_per_item: Number(r.quantity_per_item ?? 0),
      }))}
      transactions={(tx ?? []).map((t) => ({
        id: String(t.id),
        ingredient_id: String(t.ingredient_id),
        delta: Number(t.delta ?? 0),
        reason: String(t.reason),
        order_id: t.order_id ? String(t.order_id) : null,
        note: t.note ? String(t.note) : null,
        created_at: String(t.created_at),
      }))}
    />
  );
}
