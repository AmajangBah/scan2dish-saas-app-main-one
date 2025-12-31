import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for server-side usage (Server Components, API Routes, Server Actions)
 * Properly handles cookies for authentication in Next.js App Router
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();

  // On the server we can safely use non-public env vars too.
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createServerClient(
    url,
    anonKey,
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
          } catch (error) {
            // Ignore errors from middleware/cookies() in middleware context
            // This is safe as cookies are set via Set-Cookie headers in middleware
          }
        },
      },
    }
  );
}

/**
 * Backwards-compatible alias used throughout the codebase.
 * (Some files import `createClient` from "@/lib/supabase/server".)
 */
export function createClient() {
  return createServerSupabase();
}
