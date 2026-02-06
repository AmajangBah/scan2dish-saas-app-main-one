import { cache } from "react";
import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

// Cached per-request to avoid duplicate DB queries
export const getRestaurantAuthContext = cache(
  async (): Promise<RestaurantAuthContext | null> => {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return null;

    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (restaurantError || !restaurant) return null;

    const { data: onboarding } = await supabase
      .from("onboarding_progress")
      .select("completed, skipped")
      .eq("restaurant_id", restaurant.id)
      .maybeSingle();

    const onboardingCompleted =
      !onboarding || !!(onboarding.completed || onboarding.skipped);

    return {
      userId: user.id,
      restaurant,
      onboardingCompleted,
    };
  },
);

// Server-side page guard
export async function requireRestaurantPage() {
  const ctx = await getRestaurantAuthContext();
  if (!ctx) redirect("/login");
  return ctx;
}

// Server-side action guard
export async function requireRestaurant() {
  const ctx = await getRestaurantAuthContext();
  if (!ctx) throw new Error("Unauthorized");
  if (!ctx.onboardingCompleted) throw new Error("Onboarding incomplete");
  return ctx;
}
