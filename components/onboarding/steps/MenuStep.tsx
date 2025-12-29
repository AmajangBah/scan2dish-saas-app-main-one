"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, UtensilsCrossed, Plus } from "lucide-react";
import Link from "next/link";

interface MenuStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function MenuStep({ onNext, onBack }: MenuStepProps) {
  return (
    <div className="space-y-8 py-4">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <UtensilsCrossed className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold">Build Your Menu</h2>
        <p className="text-gray-600">
          Add delicious items for your customers to browse and order
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl border border-green-200">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-bold mb-1">Go to Menu Page</h3>
                <p className="text-sm text-gray-600">
                  Click "Add Menu Item" to create your first dish
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-bold mb-1">Add Item Details</h3>
                <p className="text-sm text-gray-600">
                  Name, description, price, category, and optional images
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-bold mb-1">Categories & Tags</h3>
                <p className="text-sm text-gray-600">
                  Organize with categories (Starters, Mains, Drinks, Desserts) and add tags (Spicy, Vegetarian, etc.)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="font-bold mb-1">Multi-Language Support</h3>
                <p className="text-sm text-gray-600">
                  Your menu will be automatically translated to English, French, and Spanish for customers
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-green-200">
            <Link href="/dashboard/menu" target="_blank">
              <Button className="w-full bg-green-600 hover:bg-green-700 gap-2">
                <Plus size={16} />
                Open Menu Page
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            💡 <strong>Pro Tip:</strong> Add at least 3-5 items to give customers a good selection. You can always add more later!
          </p>
        </div>
      </div>

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
          Continue
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
