import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for server-side usage (Server Components, API Routes, Server Actions)
 *
 * CRITICAL: Uses official Supabase SSR pattern with zero cookie manipulation.
 * - Does NOT decode/encode cookies
 * - Does NOT force httpOnly, sameSite, or maxAge options
 * - Let Supabase manage all cookie operations
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();

  // Use public env vars - they work on both server and client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      `Missing Supabase environment variables. URL: ${!!url}, Key: ${!!anonKey}`
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        // Return cookies exactly as-is, no decoding or manipulation
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          // Pass through Supabase's cookie decisions without modification
          // This includes session refresh, token rotation, and session invalidation
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options as CookieOptions);
          });
        } catch {
          // Ignore errors in middleware context (handled by middleware.ts)
          // This is safe as middleware.ts uses createMiddlewareClient instead
        }
      },
    },
  });
}

/**
 * Backwards-compatible alias used throughout the codebase.
 * (Some files import `createClient` from "@/lib/supabase/server".)
 */
export function createClient() {
  return createServerSupabase();
}
