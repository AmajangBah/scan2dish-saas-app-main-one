import { redirect } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function RegisterLayout({
  children,
}: {
  children: ReactNode;
}) {
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
            // Ignore errors
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If already logged in, redirect appropriately
  if (user) {
    // Check if admin
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("id, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (adminUser) {
      redirect("/admin");
    }

    // Check if restaurant user with completed onboarding
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (restaurant?.id) {
      const { data: onboarding } = await supabase
        .from("onboarding_progress")
        .select("completed, skipped")
        .eq("restaurant_id", restaurant.id)
        .maybeSingle();

      const onboardingCompleted =
        onboarding === null || !!(onboarding?.completed || onboarding?.skipped);

      redirect(onboardingCompleted ? "/dashboard" : "/onboarding");
    }

    // User exists, let them continue with registration
  }

  return children;
}
