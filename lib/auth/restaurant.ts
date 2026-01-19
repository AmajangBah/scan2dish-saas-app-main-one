import { cache } from "react";
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

/**
 * Get restaurant auth context for current user.
 * Cached per request to avoid repeated DB calls.
 * Returns null if user is not authenticated as a restaurant user.
 */
export const getRestaurantAuthContext = cache(
  async (): Promise<RestaurantAuthContext | null> => {
    try {
      const supabase = await createServerSupabase();

      // CRITICAL for Vercel: Refresh session before validation
      // This ensures the JWT token is fresh and prevents session loss on navigation
      // The refresh will update cookies if needed
      try {
        await supabase.auth.refreshSession();
      } catch {
        // Refresh might fail if user has no valid refresh token
        // We'll still try to get the user below
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!user) {
        console.log("[Auth] No user found", { error });
        return null;
      }

      console.log("[Auth] User found:", user.id);

      // Fetch restaurant record
      const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurants")
        .select(
          "id, user_id, name, phone, brand_color, currency, created_at, updated_at"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (restaurantError || !restaurant) {
        return null;
      }

      // Fetch onboarding status
      const { data: onboarding } = await supabase
        .from("onboarding_progress")
        .select("completed, skipped")
        .eq("restaurant_id", restaurant.id)
        .maybeSingle();

      // If record doesn't exist (null), treat as complete
      const onboardingCompleted =
        onboarding === null || !!(onboarding?.completed || onboarding?.skipped);

      return {
        userId: user.id,
        restaurant: restaurant as RestaurantRecord,
        onboardingCompleted,
      };
    } catch (err) {
      console.error("[Auth] Exception in getRestaurantAuthContext:", err);
      return null;
    }
  }
);

/**
 * Require restaurant auth in layouts/pages.
 * Redirects to login if not authenticated.
 */
export async function requireRestaurantPage() {
  const ctx = await getRestaurantAuthContext();
  if (!ctx) {
    redirect("/login");
  }
  return ctx;
}

/**
 * Require restaurant auth in server actions / route handlers.
 * Throws if not authenticated.
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
