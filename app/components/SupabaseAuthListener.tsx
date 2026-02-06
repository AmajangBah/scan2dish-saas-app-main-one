// "use client";

// import { useEffect } from "react";
// import { createBrowserSupabase } from "@/lib/supabase/client";
// import { syncSessionOnServer, clearSessionOnServer } from "@/app/actions/auth";

// export default function SupabaseAuthListener() {
//   useEffect(() => {
//     const supabase = createBrowserSupabase();

//     const { data } = supabase.auth.onAuthStateChange(
//       async (_event, session) => {
//         const access_token = session?.access_token ?? null;
//         const refresh_token = session?.refresh_token ?? null;

//         try {
//           if (access_token && refresh_token) {
//             // Sync rotated/updated tokens to server cookies so SSR recognizes session
//             await syncSessionOnServer({ access_token, refresh_token });
//           } else {
//             // Clear server session when client signs out
//             await clearSessionOnServer();
//           }
//         } catch {
//           // best-effort sync; ignore failures
//         }
//       },
//     );

//     return () => {
//       // unsubscribe listener if supported
//       // v2 returns { subscription } inside data
//       const sub = (data as any)?.subscription ?? (data as any);
//       if (sub?.unsubscribe) sub.unsubscribe();
//     };
//   }, []);

//   return null;
// }
