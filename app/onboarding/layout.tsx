import { redirect } from "next/navigation";
import { getRestaurantAuthContext } from "@/lib/auth/restaurant";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  // REBUILT: Require authenticated user
  const ctx = await getRestaurantAuthContext();

  if (!ctx) {
    // Not authenticated - redirect to login
    redirect("/login");
  }

  // REBUILT: If onboarding is complete, redirect away from this page
  if (ctx.onboardingCompleted) {
    redirect("/dashboard");
  }

  // User is authenticated and onboarding is incomplete - render the page
  return children;
}
