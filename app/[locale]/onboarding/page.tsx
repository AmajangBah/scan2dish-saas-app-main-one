import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { requireRestaurantPage } from "@/lib/auth/restaurant";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const ctx = await requireRestaurantPage({ allowOnboardingIncomplete: true });

  if (ctx.onboardingCompleted) {
    redirect("/dashboard");
  }

  return (
    <div className="p-6">
      <OnboardingWizard forceOpen />
    </div>
  );
}

