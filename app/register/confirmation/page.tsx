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
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border bg-white p-8 shadow-sm">
        
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(200,69,1,0.1)]">
            🍽
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome to Scan2Dish
          </h1>
          <p className="mt-3 text-gray-600">
            Your restaurant account has been successfully created.
          </p>
        </div>

        {/* Status */}
        <div className="mt-8">
          {hasSession === false && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 text-orange-900">
              <strong className="block mb-1">One last step 🚀</strong>
              Check your email and click the confirmation link to activate your
              account. Once confirmed, you can log in and complete your restaurant
              setup.
            </div>
          )}

          {hasSession === true && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-green-900">
              <strong className="block mb-1">You're all set 🎉</strong>
              Your account is active. Continue setting up your restaurant and
              start receiving orders.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {hasSession === true ? (
            <>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-xl bg-[#C84501] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9E3600]"
              >
                Go to Dashboard
              </Link>

              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl border px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Back to home
              </Link>
            </>
          ) : (
            <>
              <button
                disabled
                className="inline-flex items-center justify-center rounded-xl bg-gray-200 px-5 py-3 text-sm font-semibold text-gray-500 cursor-not-allowed"
              >
                Continue setup (confirm email first)
              </button>

              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl border px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Back to home
              </Link>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-500">
          © 2026 Scan2Dish · Smart QR Ordering for Restaurants
        </p>
      </div>
    </div>
  );
}
