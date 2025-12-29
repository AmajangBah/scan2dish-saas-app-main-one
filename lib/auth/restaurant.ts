import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

async function getUserOrNull() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

const isAdminUserId = cache(async (userId: string): Promise<boolean> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  return !error && !!data;
});

export const getRestaurantAuthContext = cache(
  async (): Promise<RestaurantAuthContext | null> => {
    const user = await getUserOrNull();
    if (!user) return null;

    // Hard separation: admins are not restaurant users
    if (await isAdminUserId(user.id)) return null;

    const supabase = await createClient();

    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id, user_id, name, phone, brand_color, currency, created_at, updated_at")
      .eq("user_id", user.id)
      .single();

    if (restaurantError || !restaurant) return null;

    const { data: onboarding } = await supabase
      .from("onboarding_progress")
      .select("completed, skipped")
      .eq("restaurant_id", restaurant.id)
      .maybeSingle();

    const onboardingCompleted = !!(onboarding?.completed || onboarding?.skipped);

    return {
      userId: user.id,
      restaurant: restaurant as RestaurantRecord,
      onboardingCompleted,
    };
  }
);

/**
 * Use in Server Components/layouts/pages to gate restaurant-only pages.
 * Redirects to the correct login area depending on the user role.
 */
export async function requireRestaurantPage(options?: {
  allowOnboardingIncomplete?: boolean;
}) {
  const user = await getUserOrNull();
  if (!user) {
    redirect("/login");
  }

  if (await isAdminUserId(user.id)) {
    redirect("/admin");
  }

  const ctx = await getRestaurantAuthContext();
  if (!ctx) {
    redirect("/login");
  }

  if (!options?.allowOnboardingIncomplete && !ctx.onboardingCompleted) {
    redirect("/onboarding");
  }

  return ctx;
}

/**
 * Use in server actions / route handlers when you want a hard failure (not redirect).
 */
export async function requireRestaurant(): Promise<RestaurantAuthContext> {
  const ctx = await getRestaurantAuthContext();
  if (!ctx) {
    throw new Error("Unauthorized: Restaurant access required");
  }
  if (!ctx.onboardingCompleted) {
    throw new Error("Unauthorized: Onboarding incomplete");
  }
  return ctx;
}

