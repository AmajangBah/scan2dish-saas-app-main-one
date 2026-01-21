"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

// Server action to accept client-side auth tokens and set
// the Supabase server-side cookies so SSR recognizes the session.
export async function syncSessionOnServer({
  access_token,
  refresh_token,
  redirectTo,
}: {
  access_token: string | null;
  refresh_token: string | null;
  redirectTo?: string;
}) {
  if (!access_token || !refresh_token) {
    if (redirectTo) redirect(redirectTo);
    return;
  }

  const supabase = await createServerSupabase();

  await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (redirectTo) redirect(redirectTo);
}

/**
 * Server action for post-login redirects.
 * Ensures the session is committed server-side before redirecting,
 * so the middleware will recognize the authenticated user.
 */
export async function redirectAfterLogin(path: string) {
  redirect(path);
}

export async function clearSessionOnServer({
  redirectTo,
}: { redirectTo?: string } = {}) {
  const supabase = await createServerSupabase();

  try {
    await supabase.auth.signOut();
  } catch {
    // ignore errors while clearing session
  }

  if (redirectTo) redirect(redirectTo);
}
