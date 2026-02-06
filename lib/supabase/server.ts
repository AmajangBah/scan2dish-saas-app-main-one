import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for server-side operations (Server Components, Server Actions, API Routes)
 * This properly syncs cookies between requests using Next.js cookies() API
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Ensure cookies are set with proper options for persistence
              cookieStore.set(name, value, {
                ...options,
                // Preserve Supabase's httpOnly setting (important for security)
                httpOnly: options?.httpOnly !== false,
                sameSite: options?.sameSite || "lax",
                secure: process.env.NODE_ENV === "production",
                path: options?.path || "/",
              });
            });
          } catch (error) {
            // In Server Actions, cookies() can throw if called after response is sent
            // This is expected behavior - ignore silently
            if (process.env.NODE_ENV === "development") {
              console.error("[Supabase] Cookie write failed (this may be expected in some contexts):", error);
            }
          }
        },
      },
    },
  );
}
