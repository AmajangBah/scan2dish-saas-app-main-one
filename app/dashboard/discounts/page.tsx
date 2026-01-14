import { getDiscounts } from "@/app/actions/discounts";
import DiscountsClient from "./DiscountsClient";
import { requireRestaurantPage } from "@/lib/auth/restaurant";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DiscountsPage() {
  const ctx = await requireRestaurantPage();

  const discounts = await getDiscounts();
  const supabase = await createServerSupabase();

  const { data: menuItems, error } = await supabase
    .from("menu_items")
    .select("id, name, category")
    .eq("restaurant_id", ctx.restaurant.id)
    .eq("available", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch menu items:", error);
  }

  const availableCategories = Array.from(
    new Set(
      (menuItems || [])
        .map((m) => (m.category ? String(m.category) : ""))
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  const availableItems = (menuItems || [])
    .filter((m) => m.name) // Ensure items have names
    .map((m) => ({
      id: String(m.id),
      name: String(m.name),
    }));

  console.log("Discounts Page - Available Categories:", availableCategories);
  console.log("Discounts Page - Available Items:", availableItems);

  return (
    <DiscountsClient
      initialDiscounts={discounts}
      currency={ctx.restaurant.currency || "GMD"}
      availableCategories={availableCategories}
      availableItems={availableItems}
    />
  );
}
