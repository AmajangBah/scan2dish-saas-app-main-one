// "use server";

// import { redirect } from "next/navigation";
// import { createServerSupabase } from "@/lib/supabase/server";

// /**
//  * REBUILT: Sync client-side auth tokens to server-side session
//  * Called after successful login/signup to establish server-side session
//  *
//  * @param access_token - JWT access token from Supabase auth
//  * @param refresh_token - Refresh token from Supabase auth
//  * @param redirectTo - URL to redirect to after syncing
//  */
// export async function syncSessionOnServer({
//   access_token,
//   refresh_token,
//   redirectTo,
// }: {
//   access_token: string | null;
//   refresh_token: string | null;
//   redirectTo?: string;
// }) {
//   // Validate tokens are present
//   if (!access_token || !refresh_token) {
//     console.warn("[Auth] Missing tokens for session sync", {
//       hasAccessToken: !!access_token,
//       hasRefreshToken: !!refresh_token,
//     });
//     if (redirectTo) redirect(redirectTo);
//     return;
//   }

//   try {
//     const supabase = await createServerSupabase();

//     // Set the session with the tokens from the client
//     // This updates the server-side cookies via proxy.ts
//     await supabase.auth.setSession({
//       access_token,
//       refresh_token,
//     });

//     console.log("[Auth] Session synced to server");
//   } catch (err) {
//     console.error("[Auth] Failed to sync session", err);
//     throw err;
//   }

//   // Redirect after successful sync
//   if (redirectTo) {
//     redirect(redirectTo);
//   }
// }

// /**
//  * REBUILT: Server-side logout
//  * Clears the Supabase session and optionally redirects
//  *
//  * @param redirectTo - URL to redirect to after logout
//  */
// export async function clearSessionOnServer({
//   redirectTo,
// }: { redirectTo?: string } = {}) {
//   try {
//     const supabase = await createServerSupabase();

//     // Sign out and clear session
//     const { error } = await supabase.auth.signOut();

//     if (error) {
//       console.error("[Auth] Sign out error", error);
//     }

//     console.log("[Auth] Session cleared");
//   } catch (err) {
//     console.error("[Auth] Exception during sign out", err);
//     // Continue anyway - don't throw
//   }

//   // Redirect after logout
//   if (redirectTo) {
//     redirect(redirectTo);
//   }
// }

// /**
//  * REBUILT: Redirect after login
//  * Server action wrapper for redirects (ensures no stale data)
//  *
//  * @param path - Path to redirect to
//  */
// export async function redirectAfterLogin(path: string) {
//   redirect(path);
// }
