import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { requireRestaurantPage } from "@/lib/auth/restaurant";
import { redirect } from "next/navigation";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const ctx = await requireRestaurantPage({ allowOnboardingIncomplete: true });

  if (ctx.onboardingCompleted) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="p-6">
      <OnboardingWizard forceOpen />
    </div>
  );
}

