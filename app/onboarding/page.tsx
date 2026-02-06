import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { getRestaurantAuthContext } from "@/lib/auth/restaurant";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  // REBUILT: Layout enforces auth and redirects if complete
  // This page only renders when user is authenticated and onboarding is incomplete
  const ctx = await getRestaurantAuthContext();

  if (!ctx) {
    // Should not happen due to layout protection, but be safe
    return <div>Authentication required</div>;
  }

  return (
    <div className="p-6">
      <OnboardingWizard forceOpen />
    </div>
  );
}
