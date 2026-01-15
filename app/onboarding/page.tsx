import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

export default async function OnboardingPage() {
  // Layout enforces auth and redirects to dashboard if onboarding is complete
  // This page only renders when user is authenticated and onboarding is incomplete
  return (
    <div className="p-6">
      <OnboardingWizard forceOpen />
    </div>
  );
}
