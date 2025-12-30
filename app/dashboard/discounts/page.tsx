import { getDiscounts } from "@/app/actions/discounts";
import DiscountsClient from "./DiscountsClient";
import { requireRestaurantPage } from "@/lib/auth/restaurant";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function DiscountsPage() {
  const ctx = await requireRestaurantPage();

  const discounts = await getDiscounts();
  const supabase = await createServerSupabase();

  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("id, name, category")
    .eq("restaurant_id", ctx.restaurant.id)
    .order("name", { ascending: true });

  const availableCategories = Array.from(
    new Set(
      (menuItems || [])
        .map((m) => (m.category ? String(m.category) : ""))
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  const availableItems = (menuItems || []).map((m) => ({
    id: String(m.id),
    name: String(m.name),
  }));

  return (
    <DiscountsClient
      initialDiscounts={discounts}
      currency={ctx.restaurant.currency || "GMD"}
      availableCategories={availableCategories}
      availableItems={availableItems}
    />
  );
}
