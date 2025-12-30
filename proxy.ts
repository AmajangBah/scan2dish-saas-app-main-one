import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n";

// Create i18n middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  // App routes are nested under /[locale]/..., so keep prefixes consistent.
  localePrefix: "always",
});

/**
 * Middleware to:
 * 1. Handle internationalization (i18n)
 * 2. Protect authenticated routes
 * 3. Refresh Supabase session
 */
export async function proxy(request: NextRequest) {
  // Handle i18n first
  const intlResponse = intlMiddleware(request);

  // If i18n middleware wants to redirect, let it
  if (intlResponse && intlResponse.headers.get("x-middleware-rewrite")) {
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
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

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

    const onboardingCompleted = !!(
      onboarding?.completed || onboarding?.skipped
    );
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
