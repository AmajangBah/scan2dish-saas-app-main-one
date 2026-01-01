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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
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
          nextSegments[menuIdx + 1] = encodeURIComponent(String(table.table_number));

          const url = request.nextUrl.clone();
          url.pathname = `/${nextSegments.join("/")}`;

          const redirectRes = NextResponse.redirect(url);
          redirectRes.cookies.set("s2d_table_id", String(table.id), {
            path: "/",
            sameSite: "lax",
          });
          redirectRes.cookies.set("s2d_restaurant_id", String(table.restaurant_id), {
            path: "/",
            sameSite: "lax",
          });
          redirectRes.cookies.set("s2d_table_number", String(table.table_number), {
            path: "/",
            sameSite: "lax",
          });
          return redirectRes;
        }
      } else {
        // If the URL is already using a table number, try to set disambiguation cookies
        // (helps when table numbers are not globally unique).
        const existingRestaurantId = request.cookies.get("s2d_restaurant_id")?.value ?? null;
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

  async function isAdminUser(): Promise<boolean> {
    if (!user) return false;
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("id, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    return !!adminUser;
  }

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL(ADMIN_SIGN_IN_PATH, request.url);
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user is admin
    const adminUser = await isAdminUser();

    if (!adminUser) {
      // Not an admin - redirect to regular dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!user) {
      // Redirect to login with return URL
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Hard separation: admins cannot use restaurant dashboard routes
    if (await isAdminUser()) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    // Enforce onboarding completion before any dashboard access
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!restaurant?.id) {
      // No restaurant record - treat as unauthenticated for restaurant UX
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { data: onboarding } = await supabase
      .from("onboarding_progress")
      .select("completed, skipped")
      .eq("restaurant_id", restaurant.id)
      .maybeSingle();

    const onboardingCompleted = !!(onboarding?.completed || onboarding?.skipped);
    if (!onboardingCompleted && request.nextUrl.pathname !== "/onboarding") {
      const url = new URL("/onboarding", request.url);
      url.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from auth pages
  if (
    (request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/register" ||
      request.nextUrl.pathname === ADMIN_SIGN_IN_PATH) &&
    user
  ) {
    // Check if admin
    const adminUser = await isAdminUser();

    if (adminUser) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.redirect(new URL("/dashboard", request.url));
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

