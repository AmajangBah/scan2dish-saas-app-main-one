"use client";

import { Button } from "@/components/ui/button";
import { PartyPopper, CheckCircle2 } from "lucide-react";

interface CompleteStepProps {
  onComplete: () => void;
}

export default function CompleteStep({ onComplete }: CompleteStepProps) {
  return (
    <div className="text-center space-y-8 py-8">
      <div className="flex justify-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
          <PartyPopper className="w-12 h-12 text-green-600" />
        </div>
      </div>

      <div className="space-y-4">
        <h1 className="text-4xl font-bold">
          🎉 You're All Set!
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Your restaurant is ready to start accepting orders through Scan2Dish
        </p>
      </div>

      <div className="max-w-2xl mx-auto bg-gradient-to-br from-orange-50 to-yellow-50 p-8 rounded-2xl border-2 border-[#C84501]">
        <h3 className="text-xl font-bold mb-6">What's Next?</h3>
        
        <div className="space-y-4 text-left">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold">Start Receiving Orders</p>
              <p className="text-sm text-gray-600">
                Customers can now scan QR codes and place orders
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold">Manage Orders</p>
              <p className="text-sm text-gray-600">
                Update order status: Pending → Preparing → Completed
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold">Track Performance</p>
              <p className="text-sm text-gray-600">
                View analytics, revenue, and top-selling items
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold">Commission Tracking</p>
              <p className="text-sm text-gray-600">
                Remember: 5% commission on completed orders. We'll calculate it automatically!
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Button
          onClick={onComplete}
          size="lg"
          className="bg-[#C84501] hover:bg-orange-700 px-12"
        >
          Go to Dashboard
        </Button>

        <p className="text-sm text-gray-500">
          Need help? Check out our support docs or contact us anytime
        </p>
      </div>
    </div>
  );
}
