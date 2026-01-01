"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Route from "@/app/constants/Route";

/**
 * Error boundary for dashboard routes
 * Provides a more contextual error page for dashboard-specific errors
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  usePathname(); // keep hook to ensure client boundary updates on navigation

  useEffect(() => {
    // Log error to console (in production, send to error tracking service)
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="space-y-2">
          <div className="text-6xl">⚠️</div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Error
          </h1>
          <p className="text-gray-600">
            We encountered an error while loading your dashboard.
          </p>
        </div>

        {process.env.NODE_ENV === "development" && error.message && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
            <p className="text-sm font-semibold text-red-900 mb-2">
              Error Details:
            </p>
            <p className="text-xs font-mono text-red-800 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-red-600 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            className="bg-[#C84501] hover:bg-orange-700"
          >
            Try Again
          </Button>
          <Link href={Route.DASHBOARD}>
            <Button variant="outline" className="w-full">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="text-sm text-gray-500 space-y-1">
          <p>Possible solutions:</p>
          <ul className="list-disc list-inside text-left max-w-sm mx-auto">
            <li>Refresh the page</li>
            <li>Check your internet connection</li>
            <li>Log out and log back in</li>
            <li>Clear your browser cache</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
