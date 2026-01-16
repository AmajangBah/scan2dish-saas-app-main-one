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

export function middleware(request: NextRequest) {
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
    }
  );

  // Don't call getUser() here - it will throw if no refresh token exists
  // Supabase will refresh tokens automatically when needed in server components

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
