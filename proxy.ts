import { createServerClient } from "@supabase/ssr";
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

  // ✅ Always generate ONE response instance
  let response = NextResponse.next();

  // ✅ Apply i18n FIRST (before Supabase)
  if (isMenuRoute) {
    response = intlMiddleware(request);
  }

  // ✅ Supabase SSR cookie bridge
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // ✅ Refresh session & sync cookies
  await supabase.auth.getUser();

  // Menu URL cleanup: convert UUID to table number
  if (isMenuRoute && pathname.includes("/menu/")) {
    const segments = pathname.split("/").filter(Boolean);
    const hasLocale = isLocaleSegment(segments[0]);
    const menuIdx = hasLocale ? 1 : 0;

    if (segments[menuIdx] === "menu" && segments.length > menuIdx + 1) {
      const tableSeg = segments[menuIdx + 1];

      if (uuidRegex.test(tableSeg)) {
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

// ✅ Apply middleware everywhere except static files
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
