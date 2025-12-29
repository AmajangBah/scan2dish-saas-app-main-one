"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, DollarSign, CheckCircle2 } from "lucide-react";

interface CommissionStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function CommissionStep({ onNext, onBack }: CommissionStepProps) {
  const commissionRate = 5; // 5%

  return (
    <div className="space-y-8 py-4">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold">Simple, Transparent Pricing</h2>
        <p className="text-lg text-gray-600">
          Scan2Dish is commission-based. You only pay when you make money.
        </p>
      </div>

      {/* Commission breakdown */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-8 rounded-2xl border-2 border-[#C84501]">
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-[#C84501]">{commissionRate}%</div>
            <div className="text-lg text-gray-700 mt-2">per completed order</div>
          </div>

          <div className="space-y-4 mt-6">
            <div className="bg-white p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">Example Order</div>
                  <div className="text-sm text-gray-600">Customer pays D100</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">D95</div>
                  <div className="text-sm text-gray-600">You keep</div>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Commission: D5 ({commissionRate}%)
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">Monthly Revenue</div>
                  <div className="text-sm text-gray-600">D10,000 in orders</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">D9,500</div>
                  <div className="text-sm text-gray-600">You keep</div>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Commission: D500 ({commissionRate}%)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <div className="font-semibold">No Setup Fees</div>
            <div className="text-sm text-gray-600">Start for free, pay only when you earn</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <div className="font-semibold">No Monthly Subscriptions</div>
            <div className="text-sm text-gray-600">Only pay commission on completed orders</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <div className="font-semibold">Unlimited Orders</div>
            <div className="text-sm text-gray-600">No limits on how much you can earn</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <div className="font-semibold">Cancel Anytime</div>
            <div className="text-sm text-gray-600">No contracts, no commitments</div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between items-center pt-6">
        <Button
          onClick={onBack}
          variant="outline"
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Back
        </Button>

        <Button
          onClick={onNext}
          className="bg-[#C84501] hover:bg-orange-700 gap-2"
        >
          I Understand
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
