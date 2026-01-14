import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createNextIntlMiddleware from "next-intl/middleware";
import { defaultLocale, locales } from "./i18n";
import { cookies } from "next/headers";

// i18n proxy middleware
const intlMiddleware = createNextIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

// UUID test
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isLocaleSegment(seg: string | undefined) {
  return !!seg && (locales as readonly string[]).includes(seg);
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const localePrefixRegex = new RegExp(`^/(${locales.join("|")})(/|$)`);

  const isMenuRoute =
    pathname === "/menu" ||
    pathname.startsWith("/menu/") ||
    (localePrefixRegex.test(pathname) &&
      pathname.split("/").filter(Boolean)[1] === "menu");

  // run i18n
  let response = isMenuRoute
    ? (await intlMiddleware(request))!
    : NextResponse.next();

  // supabase client
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
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Menu URL cleanup: `/menu/<uuid>/…`
  if (isMenuRoute && pathname.includes("/menu/")) {
    const segments = pathname.split("/").filter(Boolean);
    const hasLocale = isLocaleSegment(segments[0]);
    const menuIdx = hasLocale ? 1 : 0;

    if (segments[menuIdx] === "menu" && segments.length > menuIdx + 1) {
      const tableSeg = segments[menuIdx + 1];

      if (uuidRegex.test(tableSeg)) {
        const { data: table } = await supabase
          .from("restaurant_tables")
          .select("id, restaurant_id, table_number, is_active")
          .eq("id", tableSeg)
          .eq("is_active", true)
          .single();

        if (table?.table_number) {
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
            maxAge: 60 * 60 * 24,
          });
          redirectRes.cookies.set(
            "s2d_restaurant_id",
            String(table.restaurant_id),
            {
              path: "/",
              sameSite: "lax",
              maxAge: 60 * 60 * 24,
            }
          );
          redirectRes.cookies.set(
            "s2d_table_number",
            String(table.table_number),
            {
              path: "/",
              sameSite: "lax",
              maxAge: 60 * 60 * 24,
            }
          );

          return redirectRes;
        }
      }
    }
  }

  // Auth page and admin logic
  const ADMIN_SIGN_IN_PATH = "/auth/admin/sign-in";
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === ADMIN_SIGN_IN_PATH;

  async function isAdminUser(): Promise<boolean> {
    if (!user) return false;
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("id, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();
    return !!adminUser;
  }

  if (isAuthPage) {
    if (user) {
      const adminUser = await isAdminUser();
      if (adminUser)
        return NextResponse.redirect(new URL("/admin", request.url));

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
          onboarding !== null && (onboarding.completed || onboarding.skipped);

        return NextResponse.redirect(
          new URL(
            onboardingCompleted ? "/dashboard" : "/onboarding",
            request.url
          )
        );
      }

      return NextResponse.redirect(new URL("/register", request.url));
    }

    return response;
  }

  // Admin routes
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL(ADMIN_SIGN_IN_PATH, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!(await isAdminUser())) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (await isAdminUser()) {
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

    const onboardingCompleted =
      onboarding !== null && (onboarding.completed || onboarding.skipped);

    if (!onboardingCompleted && pathname !== "/onboarding") {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  // Onboarding routes
  if (pathname.startsWith("/onboarding")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (await isAdminUser()) {
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
  }

  return response;
}

export const config = {
  matcher: [
    // proxy will run on these patterns
    "/((?!api|_next|.*\\..*).*)",
    "/",
  ],
};
