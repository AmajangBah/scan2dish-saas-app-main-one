"use client";

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface WelcomeStepProps {
  onNext: () => void;
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="text-center space-y-6 py-8">
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-[#C84501]" />
        </div>
      </div>
      
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">
          Welcome to <span className="text-[#C84501]">Scan2Dish</span>!
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Transform your restaurant with QR-code contactless ordering
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-left">
        <div className="p-6 bg-gray-50 rounded-xl">
          <div className="text-3xl mb-3">📱</div>
          <h3 className="font-bold mb-2">Easy for Customers</h3>
          <p className="text-sm text-gray-600">
            Customers scan QR codes, browse your menu, and order instantly from their phones
          </p>
        </div>

        <div className="p-6 bg-gray-50 rounded-xl">
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="font-bold mb-2">Fast Setup</h3>
          <p className="text-sm text-gray-600">
            Get started in minutes. Add tables, menu items, and generate QR codes effortlessly
          </p>
        </div>

        <div className="p-6 bg-gray-50 rounded-xl">
          <div className="text-3xl mb-3">📊</div>
          <h3 className="font-bold mb-2">Real-time Analytics</h3>
          <p className="text-sm text-gray-600">
            Track orders, revenue, and customer trends with powerful analytics
          </p>
        </div>
      </div>

      <div className="pt-8">
        <Button
          onClick={onNext}
          size="lg"
          className="bg-[#C84501] hover:bg-orange-700 px-12"
        >
          Let&apos;s Get Started
        </Button>
      </div>
    </div>
  );
}
