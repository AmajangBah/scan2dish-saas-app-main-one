import { createServerClient, type CookieOptions } from "@supabase/ssr";
import createNextIntlMiddleware from "next-intl/middleware";
import { defaultLocale, locales } from "./i18n";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const intlMiddleware = createNextIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

// UUID test - for menu route table ID cleanup
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isLocaleSegment(seg: string | undefined) {
  return !!seg && (locales as readonly string[]).includes(seg);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const localePrefixRegex = new RegExp(`^/(${locales.join("|")})(/|$)`);

  const isMenuRoute =
    pathname === "/menu" ||
    pathname.startsWith("/menu/") ||
    (localePrefixRegex.test(pathname) &&
      pathname.split("/").filter(Boolean)[1] === "menu");

  // Run i18n middleware
  let response = isMenuRoute ? intlMiddleware(request) : NextResponse.next();

  // CRITICAL: Handle Supabase session cookies in middleware
  // On Vercel Edge, cookies from request must be explicitly copied to response
  // This ensures session persists across requests in production
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Read cookies from the request
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write cookies to the response
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options as CookieOptions);
          });
        },
      },
    },
  );

  // Validate and refresh session at middleware level
  // This ensures tokens are fresh before any route handlers run
  // Prevents stale token issues for restaurant owners
  try {
    const { data, error } = await supabase.auth.getUser();

    // If we have a user, attempt to refresh their session to ensure token is fresh
    if (data?.user && !error) {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.log(
          "[Middleware] Session refresh failed:",
          refreshError.message,
        );
      }
    } else if (error) {
      // If getUser() failed with auth error, try to refresh anyway
      // This handles cases where token is stale but refresh token is valid
      await supabase.auth.refreshSession().catch(() => {
        // Session refresh failed - user will be logged out on next navigation
      });
    }
  } catch (err) {
    // Log unexpected errors but don't interrupt request
    console.error("[Middleware] Unexpected error in auth refresh:", err);
  }

  // Menu URL cleanup: convert UUID to table number
  if (isMenuRoute && pathname.includes("/menu/")) {
    const segments = pathname.split("/").filter(Boolean);
    const hasLocale = isLocaleSegment(segments[0]);
    const menuIdx = hasLocale ? 1 : 0;

    if (segments[menuIdx] === "menu" && segments.length > menuIdx + 1) {
      const tableSeg = segments[menuIdx + 1];

      if (uuidRegex.test(tableSeg)) {
        // Set table context cookies for client-side usage
        response.cookies.set("s2d_table_id", tableSeg, {
          path: "/",
          sameSite: "lax",
          maxAge: 60 * 60 * 24,
        });
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Run on all routes except static files and API
    "/((?!api|_next|.*\\..*).*)",
    "/",
  ],
};
