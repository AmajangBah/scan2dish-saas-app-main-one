import { cache } from "react";
import { redirect } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

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
 * Get current authenticated user.
 * Returns null if no valid session.
 */
async function getCurrentUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptions);
            });
          } catch {
            // Ignore errors in server context
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ?? null;
}

/**
 * Get restaurant auth context for current user.
 * Cached per request to avoid repeated DB calls.
 * Returns null if user is not authenticated as a restaurant user.
 */
export const getRestaurantAuthContext = cache(
  async (): Promise<RestaurantAuthContext | null> => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return null;
      }

      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) => {
                  cookieStore.set(name, value, options as CookieOptions);
                });
              } catch {
                // Ignore errors in server context
              }
            },
          },
        }
      );

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
