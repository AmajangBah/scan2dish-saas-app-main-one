import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { defaultLocale, locales } from "./i18n";

// Create i18n middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  // App routes are nested under /[locale]/..., so keep prefixes consistent.
  localePrefix: "always",
});

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isLocaleSegment(seg: string | undefined) {
  return !!seg && (locales as readonly string[]).includes(seg);
}

/**
 * Proxy to:
 * 1. Handle internationalization (i18n) for customer menu routes
 * 2. Protect authenticated routes (dashboard/admin)
 * 3. Refresh Supabase session
 * 4. Clean customer menu URLs by redirecting UUID table IDs -> table numbers
 */
export async function proxy(request: NextRequest) {
  /**
   * Only run i18n routing for translated, customer-facing menu routes.
   * Dashboards + home must remain stable and non-localized.
   */
  const pathname = request.nextUrl.pathname;
  const localePrefixRegex = new RegExp(`^/(${locales.join("|")})(/|$)`);
  const isMenuRoute =
    pathname === "/menu" ||
    pathname.startsWith("/menu/") ||
    (localePrefixRegex.test(pathname) &&
      pathname.split("/").filter(Boolean)[1] === "menu");

  const intlResponse = isMenuRoute ? intlMiddleware(request) : null;

  // If i18n middleware wants to redirect/rewrite, let it.
  if (
    intlResponse &&
    (intlResponse.headers.get("x-middleware-rewrite") ||
      intlResponse.headers.get("location"))
  ) {
    return intlResponse;
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // --- Menu URL cleanup: /menu/<uuid>/... -> /menu/<table_number>/...
  if (isMenuRoute) {
    const segments = pathname.split("/").filter(Boolean);
    const hasLocale = isLocaleSegment(segments[0]);
    const menuIdx = hasLocale ? 1 : 0;

    if (segments[menuIdx] === "menu" && segments.length > menuIdx + 1) {
      const tableSeg = segments[menuIdx + 1];
      if (uuidRegex.test(tableSeg)) {
        const { data: table, error } = await supabase
          .from("restaurant_tables")
          .select("id, restaurant_id, table_number, is_active")
          .eq("id", tableSeg)
          .eq("is_active", true)
          .single();

        if (!error && table?.table_number) {
          const nextSegments = [...segments];
          nextSegments[menuIdx + 1] = encodeURIComponent(
            String(table.table_number)
          );

          const url = request.nextUrl.clone();
          url.pathname = `/${nextSegments.join("/")}`;

          const redirectRes = NextResponse.redirect(url);
          redirectRes.cookies.set("s2d_table_id", String(table.id), {
            path: "/",
            sameSite: "lax",
          });
          redirectRes.cookies.set(
            "s2d_restaurant_id",
            String(table.restaurant_id),
            {
              path: "/",
              sameSite: "lax",
            }
          );
          redirectRes.cookies.set(
            "s2d_table_number",
            String(table.table_number),
            {
              path: "/",
              sameSite: "lax",
            }
          );
          return redirectRes;
        }
      } else {
        // If the URL is already using a table number, try to set disambiguation cookies
        // (helps when table numbers are not globally unique).
        const existingRestaurantId =
          request.cookies.get("s2d_restaurant_id")?.value ?? null;
        if (!existingRestaurantId) {
          const { data: matches, error } = await supabase
            .from("restaurant_tables")
            .select("id, restaurant_id, table_number")
            .eq("table_number", tableSeg)
            .eq("is_active", true)
            .limit(2);

          // Only set cookies if it uniquely identifies a single active table.
          if (!error && Array.isArray(matches) && matches.length === 1) {
            const t = matches[0] as unknown as {
              id: string;
              restaurant_id: string;
              table_number: string;
            };
            response.cookies.set("s2d_table_id", String(t.id), {
              path: "/",
              sameSite: "lax",
            });
            response.cookies.set("s2d_restaurant_id", String(t.restaurant_id), {
              path: "/",
              sameSite: "lax",
            });
            response.cookies.set("s2d_table_number", String(t.table_number), {
              path: "/",
              sameSite: "lax",
            });
          }
        }
      }
    }
  }

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ADMIN_SIGN_IN_PATH = "/auth/admin/sign-in";
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === ADMIN_SIGN_IN_PATH;

  async function isAdminUser(): Promise<boolean> {
    if (!user) return false;
    try {
      const { data: adminUser, error } = await supabase
        .from("admin_users")
        .select("id, is_active")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        // RLS blocking (406) or other errors - user is not admin
        console.debug(
          "[Middleware] Admin check blocked/error (expected for non-admin):",
          error.code,
          error.message
        );
        return false;
      }

      return !!adminUser;
    } catch (err) {
      console.error("[Middleware] isAdminUser exception:", err);
      return false;
    }
  }

  // EARLY EXIT: Auth pages first (skip expensive DB queries if possible)
  if (isAuthPage) {
    if (!user) {
      // Not authenticated - allow auth page to render
      return response;
    }

    // User is authenticated - redirect away from auth pages
    const adminUser = await isAdminUser();
    if (adminUser) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    // Restaurant user - check onboarding status
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (restaurantError) {
      console.error(
        "[Middleware] Auth page: Restaurant query failed",
        restaurantError
      );
    }

    if (restaurant?.id) {
      const { data: onboarding } = await supabase
        .from("onboarding_progress")
        .select("completed, skipped")
        .eq("restaurant_id", restaurant.id)
        .maybeSingle();

      // If onboarding record exists and is completed/skipped, go to dashboard
      // Otherwise go to onboarding (including if record is null - shouldn't happen due to trigger)
      const onboardingCompleted =
        onboarding !== null && (onboarding.completed || onboarding.skipped);

      const redirectUrl = onboardingCompleted ? "/dashboard" : "/onboarding";
      console.log("[Middleware] Auth page: Redirecting to", redirectUrl, {
        onboarding,
        onboardingCompleted,
      });
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    console.log(
      "[Middleware] Auth page: No restaurant found, redirecting to /register"
    );
    return NextResponse.redirect(new URL("/register", request.url));
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL(ADMIN_SIGN_IN_PATH, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const adminUser = await isAdminUser();
    if (!adminUser) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const adminUser = await isAdminUser();
    if (adminUser) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    // Check restaurant exists and onboarding status
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    // Log errors but don't block - user is authenticated
    if (restaurantError) {
      console.error("[Middleware] Dashboard: Restaurant query error", {
        code: restaurantError.code,
        message: restaurantError.message,
        user_id: user.id,
      });
      // If query failed (RLS or other), allow dashboard to load
      // The layout will handle auth verification
      return response;
    }

    // If no restaurant record exists at all, redirect to registration
    if (!restaurant?.id) {
      console.warn("[Middleware] Dashboard: No restaurant found for user", {
        user_id: user.id,
      });
      return NextResponse.redirect(new URL("/register", request.url));
    }

    // Check onboarding status
    const { data: onboarding, error: onboardingError } = await supabase
      .from("onboarding_progress")
      .select("completed, skipped")
      .eq("restaurant_id", restaurant.id)
      .maybeSingle();

    if (onboardingError) {
      console.error(
        "[Middleware] Dashboard: Onboarding query error",
        onboardingError.code,
        onboardingError.message
      );
      // If query failed, assume onboarding not complete to be safe
      if (pathname !== "/onboarding") {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    }

    // Onboarding is complete only if record exists AND is marked complete/skipped
    const onboardingCompleted =
      onboarding !== null && (onboarding.completed || onboarding.skipped);

    if (!onboardingCompleted && pathname !== "/onboarding") {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  // Protect onboarding route
  if (pathname.startsWith("/onboarding")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const adminUser = await isAdminUser();
    if (adminUser) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!restaurant?.id) {
      return NextResponse.redirect(new URL("/register", request.url));
    }

    const { data: onboarding } = await supabase
      .from("onboarding_progress")
      .select("completed, skipped")
      .eq("restaurant_id", restaurant.id)
      .maybeSingle();

    // If onboarding is complete, user should go to dashboard
    // (unless they're still on the page navigating, so be lenient)
    // Don't redirect automatically - let the page handle it
  }

  return response;
}

export const config = {
  matcher: [
    // Enable i18n routing on all paths except static files
    "/((?!api|_next|_vercel|.*\\..*).*)",
    // Also match root
    "/",
  ],
};
