"use client";

import { useEffect } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { syncSessionOnServer, clearSessionOnServer } from "@/app/actions/auth";

/**
 * Syncs client auth state to server cookies so SSR and Server Actions see the session.
 * Handles token refresh and sign out.
 */
export default function SupabaseAuthListener() {
  useEffect(() => {
    const supabase = createBrowserSupabase();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.access_token && session?.refresh_token) {
          await syncSessionOnServer({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });
        } else {
          await clearSessionOnServer();
        }
      } catch {
        // best-effort sync; ignore failures
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return null;
}
