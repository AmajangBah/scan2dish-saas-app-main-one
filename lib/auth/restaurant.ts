import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { cache } from "react";

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
 * REBUILT: Cached per-request to prevent multiple DB queries
 * This is the single source of truth for restaurant auth context
 */
export const getRestaurantAuthContext = cache(
  async (): Promise<RestaurantAuthContext | null> => {
    try {
      const supabase = await createServerSupabase();

      // Get authenticated user from Supabase session
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.log("[Auth] No authenticated user", { error: userError });
        return null;
      }

      // Query restaurant linked to this user
      const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurants")
        .select(
          "id, user_id, name, phone, brand_color, currency, created_at, updated_at",
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (restaurantError) {
        console.error("[Auth] Restaurant query failed", restaurantError);
        return null;
      }

      if (!restaurant) {
        console.log("[Auth] No restaurant found for user", { userId: user.id });
        return null;
      }

      // Check onboarding status
      const { data: onboarding, error: onboardingError } = await supabase
        .from("onboarding_progress")
        .select("completed, skipped")
        .eq("restaurant_id", restaurant.id)
        .maybeSingle();

      if (onboardingError) {
        console.error("[Auth] Onboarding query failed", onboardingError);
      }

      // Onboarding is complete if: no record exists OR (completed=true OR skipped=true)
      const onboardingCompleted =
        !onboarding || !!(onboarding.completed || onboarding.skipped);

      return {
        userId: user.id,
        restaurant: restaurant as RestaurantRecord,
        onboardingCompleted,
      };
    } catch (err) {
      console.error("[Auth] Exception in getRestaurantAuthContext", err);
      return null;
    }
  },
);

/**
 * Page-level protection: redirects unauthenticated users to login
 */
export async function requireRestaurantPage() {
  const ctx = await getRestaurantAuthContext();
  if (!ctx) {
    redirect("/login");
  }
  return ctx;
}

/**
 * Server action protection: throws error for API usage
 * Also verifies onboarding is complete
 */
export async function requireRestaurant(): Promise<RestaurantAuthContext> {
  const ctx = await getRestaurantAuthContext();

  if (!ctx) {
    throw new Error("Unauthorized: No restaurant context");
  }

  if (!ctx.onboardingCompleted) {
    throw new Error("Unauthorized: Onboarding incomplete");
  }

  return ctx;
}

/**
 * Utility: Check if user is authenticated (loose check, may not have restaurant yet)
 */
export async function isRestaurantAuthenticated(): Promise<boolean> {
  const ctx = await getRestaurantAuthContext();
  return !!ctx;
}
