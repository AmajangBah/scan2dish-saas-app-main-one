import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client that bypasses RLS using the service role key.
 *
 * IMPORTANT:
 * - Never import this from client components.
 * - Requires `SUPABASE_SERVICE_ROLE_KEY` (preferred) or `SUPABASE_SERVICE_KEY`.
 */
export function hasSupabaseServiceKey() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY);
}

export function createServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY) for service client"
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Safe helper when a service key might not be configured.
 */
export function maybeCreateServiceSupabase() {
  if (!hasSupabaseServiceKey()) return null;
  return createServiceSupabase();
}

