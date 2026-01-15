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

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const localePrefixRegex = new RegExp(`^/(${locales.join("|")})(/|$)`);

  const isMenuRoute =
    pathname === "/menu" ||
    pathname.startsWith("/menu/") ||
    (localePrefixRegex.test(pathname) &&
      pathname.split("/").filter(Boolean)[1] === "menu");

  // Run i18n middleware
  let response = isMenuRoute ? intlMiddleware(request) : NextResponse.next();

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
