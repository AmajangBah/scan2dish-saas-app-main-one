import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export type RestaurantRecord = {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  brand_color: string;
  currency: string;
  created_at: string;
  updated_at: string;
};

export type RestaurantAuthContext = {
  userId: string;
  restaurant: RestaurantRecord;
  onboardingCompleted: boolean;
};

export async function getRestaurantAuthContext(): Promise<RestaurantAuthContext | null> {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("[Auth] No user found", { error });
      return null;
    }

    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select(
        "id, user_id, name, phone, brand_color, currency, created_at, updated_at"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (restaurantError || !restaurant) return null;

    const { data: onboarding } = await supabase
      .from("onboarding_progress")
      .select("completed, skipped")
      .eq("restaurant_id", restaurant.id)
      .maybeSingle();

    const onboardingCompleted =
      onboarding === null || !!(onboarding?.completed || onboarding?.skipped);

    return {
      userId: user.id,
      restaurant: restaurant as RestaurantRecord,
      onboardingCompleted,
    };
  } catch (err) {
    console.error("[Auth] Exception:", err);
    return null;
  }
}

export async function requireRestaurantPage() {
  const ctx = await getRestaurantAuthContext();
  if (!ctx) redirect("/login");
  return ctx;
}

export async function requireRestaurant(): Promise<RestaurantAuthContext> {
  const ctx = await getRestaurantAuthContext();
  if (!ctx) throw new Error("Unauthorized");
  if (!ctx.onboardingCompleted) {
    throw new Error("Unauthorized: Onboarding incomplete");
  }
  return ctx;
}
