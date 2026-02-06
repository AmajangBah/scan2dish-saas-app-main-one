"use server";

import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Sync the current session from client to server cookies.
 * Call this after signIn/signUp on the client so the server sees the session.
 */
export async function syncSessionOnServer(credentials: {
  access_token: string;
  refresh_token: string;
}) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.setSession({
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token,
  });
  if (error) throw error;
}

/**
 * Clear the session on the server (cookies).
 * Call this when the client signs out.
 */
export async function clearSessionOnServer() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
}
