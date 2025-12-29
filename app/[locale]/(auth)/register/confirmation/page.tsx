"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export default function RegisterConfirmationPage() {
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createBrowserSupabase();
      const { data } = await supabase.auth.getSession();
      setHasSession(!!data.session);
    }
    load();
  }, []);

  return (
    <div className="max-w-lg mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold">Account created</h1>
      <p className="text-gray-600 mt-3">
        Next step: complete restaurant setup before you can access the dashboard.
      </p>

      {hasSession === false && (
        <div className="mt-6 rounded-lg border p-4 bg-orange-50 border-orange-200 text-orange-900">
          Please check your email and click the confirmation link to activate your
          account.
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <Link
          href="/onboarding"
          className="inline-flex items-center justify-center rounded-xl bg-[#C84501] px-5 py-3 text-white hover:bg-orange-700"
        >
          Continue setup
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl border px-5 py-3 hover:bg-gray-50"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

