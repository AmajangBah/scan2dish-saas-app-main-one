import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { requireRestaurantPage } from "@/lib/auth/restaurant";

export default async function OnboardingPage() {
  // Simply validate that user is authenticated restaurant user.
  // Middleware (proxy.ts) handles the routing logic:
  // - If onboarding is complete, middleware redirects to /dashboard
  // - This page only renders when onboarding is incomplete
  await requireRestaurantPage();

  return (
    <div className="p-6">
      <OnboardingWizard forceOpen />
    </div>
  );
}
