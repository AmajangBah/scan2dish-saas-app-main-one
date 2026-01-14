"use server";

import { redirect } from "next/navigation";

/**
 * Server action for post-login redirects.
 * Ensures the session is committed server-side before redirecting,
 * so the middleware will recognize the authenticated user.
 */
export async function redirectAfterLogin(path: string) {
  redirect(path);
}
