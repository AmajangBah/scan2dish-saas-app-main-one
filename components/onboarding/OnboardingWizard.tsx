"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import {
  getOnboardingProgress,
  updateOnboardingProgress,
  completeOnboarding,
  skipOnboarding,
  type OnboardingProgress,
} from "@/app/actions/onboarding";

// Import individual step components
import WelcomeStep from "./steps/WelcomeStep";
import CommissionStep from "./steps/CommissionStep";
import ProfileStep from "./steps/ProfileStep";
import TableStep from "./steps/TableStep";
import MenuStep from "./steps/MenuStep";
import QRStep from "./steps/QRStep";
import CompleteStep from "./steps/CompleteStep";

interface OnboardingWizardProps {
  forceOpen?: boolean;
}

export default function OnboardingWizard({ forceOpen = false }: OnboardingWizardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const totalSteps = 7;
  const locale = pathname.split("/").filter(Boolean)[0] || "en";
  const stepTitles = [
    "Welcome",
    "Pricing",
    "Restaurant profile",
    "Tables",
    "Menu",
    "QR codes",
    "Finish",
  ];
  const currentTitle = stepTitles[currentStep - 1] ?? "Setup";

  // Load onboarding progress on mount
  useEffect(() => {
    async function loadProgress() {
      setLoading(true);
      const data = await getOnboardingProgress();
      setProgress(data);
      
      if (data) {
        setCurrentStep(data.current_step);
        // Show wizard if not completed and not skipped
        if (!data.completed && !data.skipped) {
          setOpen(true);
        } else if (forceOpen) {
          setOpen(true);
        }
      }
      
      setLoading(false);
    }

    loadProgress();
  }, [forceOpen]);

  const handleNext = async () => {
    const nextStep = currentStep + 1;
    const stepsCompleted = progress?.steps_completed || [];
    
    if (!stepsCompleted.includes(currentStep)) {
      stepsCompleted.push(currentStep);
    }

    await updateOnboardingProgress(nextStep, stepsCompleted);
    setCurrentStep(nextStep);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    await skipOnboarding();
    setOpen(false);
    router.refresh();
  };

  const handleComplete = async () => {
    await completeOnboarding();
    setOpen(false);
    router.push(`/${locale}/dashboard`);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep onNext={handleNext} />;
      case 2:
        return <CommissionStep onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <ProfileStep onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <TableStep onNext={handleNext} onBack={handleBack} />;
      case 5:
        return <MenuStep onNext={handleNext} onBack={handleBack} />;
      case 6:
        return <QRStep onNext={handleNext} onBack={handleBack} />;
      case 7:
        return <CompleteStep onComplete={handleComplete} />;
      default:
        return <WelcomeStep onNext={handleNext} />;
    }
  };

  if (loading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header with progress */}
        <div className="relative pb-4 border-b">
          <button
            onClick={handleSkip}
            className="absolute right-0 top-0 rounded-md p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            aria-label="Skip setup"
          >
            <X size={20} />
          </button>
          
          <div className="pr-8">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold">Setup your restaurant</h2>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Step {currentStep}</span> of{" "}
                {totalSteps} • {currentTitle}
              </p>
              <p className="text-xs text-gray-500">
                You can skip for now and finish later from your dashboard.
              </p>
            </div>
            
            {/* Stepper */}
            <div className="mt-4 flex items-center gap-2">
              {Array.from({ length: totalSteps }).map((_, i) => {
                const step = i + 1;
                const isActive = step === currentStep;
                const isDone = (progress?.steps_completed || []).includes(step);
                return (
                  <div
                    key={step}
                    className={[
                      "h-2 w-8 rounded-full transition-colors",
                      isActive
                        ? "bg-[#C84501]"
                        : isDone
                        ? "bg-[#C84501]/40"
                        : "bg-gray-200",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Step content */}
        <div className="py-6">
          {renderStep()}
        </div>

        {/* Skip button at bottom */}
        {currentStep < totalSteps && (
          <div className="text-center pt-4 border-t">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Skip setup for now
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
