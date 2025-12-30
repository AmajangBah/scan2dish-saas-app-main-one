import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Logout route - signs out the user and redirects to login
 * GET /logout
 */
export async function GET(request: Request) {
  const supabase = await createServerSupabase();

  // Sign out the user
  await supabase.auth.signOut();

  // Redirect to login page
  const url = new URL("/login", request.url);
  return NextResponse.redirect(url);
}
