import { redirect } from "next/navigation";
import { getRestaurantAuthContext } from "@/lib/auth/restaurant";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const ctx = await getRestaurantAuthContext();

  // Require authenticated restaurant user
  if (!ctx) {
    redirect("/login");
  }

  // If onboarding is already complete, redirect to dashboard
  if (ctx.onboardingCompleted) {
    redirect("/dashboard");
  }

  return children;
}
