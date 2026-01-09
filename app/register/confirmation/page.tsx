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
      <h1 className="text-3xl font-bold">Account created!</h1>
      <p className="text-gray-600 mt-3">
        Your restaurant account has been successfully created with a unique
        record in our system.
      </p>

      {hasSession === false && (
        <div className="mt-6 rounded-lg border p-4 bg-blue-50 border-blue-200 text-blue-900">
          <strong>Next step:</strong> Check your email and click the
          confirmation link to activate your account. Once confirmed, you can
          log in and complete your restaurant setup.
        </div>
      )}

      {hasSession === true && (
        <div className="mt-6 rounded-lg border p-4 bg-green-50 border-green-200 text-green-900">
          <strong>You're all set!</strong> Your account is active. Click
          "Continue Setup" to configure your restaurant.
        </div>
      )}

      <div className="mt-8 flex gap-3 flex-col sm:flex-row">
        {hasSession === true ? (
          <>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-[#C84501] px-5 py-3 text-white hover:bg-orange-700"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border px-5 py-3 hover:bg-gray-50"
            >
              Back to home
            </Link>
          </>
        ) : (
          <>
            <button
              disabled
              className="inline-flex items-center justify-center rounded-xl bg-gray-300 px-5 py-3 text-gray-600 cursor-not-allowed"
            >
              Continue setup (confirm email first)
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border px-5 py-3 hover:bg-gray-50"
            >
              Back to home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
