import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { maybeCreateServiceSupabase } from "@/lib/supabase/service";

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

export const getRestaurantAuthContext = cache(
  async (): Promise<RestaurantAuthContext | null> => {
    try {
      const user = await getUserOrNull();
      if (!user) {
        console.warn(
          "[Auth] No user found in getRestaurantAuthContext - session may be expired or cookies lost"
        );
        return null;
      }
      console.log("[Auth] User found:", user.id, user.email);

      // Initialize per-request supabase client. Try this first — it may be
      // blocked by RLS in production (returns an error like 406). If that
      // happens, fall back to the server-only service client (if available)
      // to fetch restaurant metadata for rendering while preserving
      // auth/session state.
      const supabase = await createClient();

      // Try normal per-request client first. This may be blocked by RLS in
      // production (returns an error like 406). If that happens, fall back to
      // the server-only service client (if available) to fetch restaurant
      // metadata for rendering while preserving auth/session state.
      let restaurant: any = null;
      let restaurantError: any = null;

      try {
        const res = await supabase
          .from("restaurants")
          .select(
            "id, user_id, name, phone, brand_color, currency, created_at, updated_at"
          )
          .eq("user_id", user.id)
          .maybeSingle();
        restaurant = res.data;
        restaurantError = res.error;
      } catch (err) {
        restaurant = null;
        restaurantError = err;
      }

      if (restaurantError) {
        console.debug(
          "[Auth] Restaurant query blocked/error, trying service client:",
          restaurantError?.code ?? restaurantError
        );
        const service = maybeCreateServiceSupabase();
        if (service) {
          try {
            const { data: srvRest, error: srvErr } = await service
              .from("restaurants")
              .select(
                "id, user_id, name, phone, brand_color, currency, created_at, updated_at"
              )
              .eq("user_id", user.id)
              .maybeSingle();

            if (!srvErr && srvRest) {
              restaurant = srvRest;
              restaurantError = null;
            } else {
              console.error(
                "[Auth] Service client restaurant fetch failed:",
                srvErr
              );
            }
          } catch (err) {
            console.error(
              "[Auth] Service client exception fetching restaurant:",
              err
            );
          }
        }
      }

      if (!restaurant) {
        console.warn("[Auth] CRITICAL: No restaurant found for user:", {
          user_id: user.id,
          user_email: user.email,
          error: restaurantError,
        });
        return null;
      }

      // Onboarding may also be blocked by RLS; try service client if needed.
      let onboarding: any = null;
      try {
        const ob = await supabase
          .from("onboarding_progress")
          .select("completed, skipped")
          .eq("restaurant_id", restaurant.id)
          .maybeSingle();
        onboarding = ob.data;
        if (ob.error) {
          console.debug(
            "[Auth] Onboarding query error (non-critical):",
            ob.error
          );
        }
      } catch (err) {
        onboarding = null;
        console.debug("[Auth] Onboarding query threw exception:", err);
      }

      if (!onboarding) {
        const service = maybeCreateServiceSupabase();
        if (service) {
          try {
            const { data: srvOnboarding, error: srvOnboardingError } =
              await service
                .from("onboarding_progress")
                .select("completed, skipped")
                .eq("restaurant_id", restaurant.id)
                .maybeSingle();
            if (!srvOnboardingError) onboarding = srvOnboarding;
            else
              console.debug(
                "[Auth] Service onboarding fetch failed:",
                srvOnboardingError
              );
          } catch (err) {
            console.debug("[Auth] Service onboarding exception:", err);
          }
        }
      }

      // CRITICAL: Match proxy.ts logic - if record doesn't exist (null), treat as complete
      // This prevents redirect loops between proxy and layout checks
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

  const ctx = await getRestaurantAuthContext();
  if (!ctx) {
    redirect("/login");
  }

  // NOTE: Onboarding checks are now handled by middleware (proxy.ts).
  // This allows only the middleware to manage all auth routing,
  // preventing redirect loops from multiple auth checks.
  // This function only validates that a restaurant user is authenticated.

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
