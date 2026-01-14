import { createServerSupabase } from "@/lib/supabase/server";
import { requireRestaurantPage } from "@/lib/auth/restaurant";
import MenuClient from "./MenuClient";
import { MenuItem } from "./types";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const ctx = await requireRestaurantPage();
  const restaurant_id = ctx.restaurant.id;
  const currency = ctx.restaurant.currency || "GMD";

  const supabase = await createServerSupabase();

  const { data: menuItems, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", restaurant_id)
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch menu items:", error);
    return (
      <div className="p-6 min-h-screen">
        <div className="text-center text-red-600">
          Failed to load menu items. Please try again later.
        </div>
      </div>
    );
  }

  // Extract available categories from existing menu items
  const availableCategories = Array.from(
    new Set(
      (menuItems || [])
        .map((m) => (m.category ? String(m.category) : ""))
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  // Map database items to UI MenuItem type
  const mappedItems: MenuItem[] = (menuItems || []).map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description || "",
    nameTranslations:
      typeof item.name_translations === "object" &&
      item.name_translations !== null
        ? item.name_translations
        : {},
    descriptionTranslations:
      typeof item.description_translations === "object" &&
      item.description_translations !== null
        ? item.description_translations
        : {},
    price: parseFloat(item.price) || 0,
    category: item.category ? String(item.category) : "Uncategorized",
    images: Array.isArray(item.images) ? item.images : [],
    available: item.available ?? true,
    tags:
      typeof item.tags === "object" && item.tags !== null
        ? {
            spicy: item.tags.spicy ?? false,
            vegetarian: item.tags.vegetarian ?? false,
            glutenFree: item.tags.glutenFree ?? false,
          }
        : { spicy: false, vegetarian: false, glutenFree: false },
    variants: Array.isArray(item.variants) ? item.variants : [],
  }));

  return (
    <MenuClient
      initialMenuItems={mappedItems}
      currency={currency}
      restaurantId={restaurant_id}
      availableCategories={availableCategories}
    />
  );
}
