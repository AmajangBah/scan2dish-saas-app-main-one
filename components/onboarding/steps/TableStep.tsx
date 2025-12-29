"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Table2, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface TableStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function TableStep({ onNext, onBack }: TableStepProps) {
  const pathname = usePathname();
  const locale = pathname.split("/").filter(Boolean)[0] || "en";

  return (
    <div className="space-y-8 py-4">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
            <Table2 className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold">Add Your First Table</h2>
        <p className="text-gray-600">
          Tables are where customers will scan QR codes to order
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-2xl border border-purple-200">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-bold mb-1">Go to Tables Page</h3>
                <p className="text-sm text-gray-600">
                  Click &quot;Add Table&quot; to create your first table
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-bold mb-1">Enter Table Details</h3>
                <p className="text-sm text-gray-600">
                  Give it a number (e.g., &quot;Table 1&quot;), capacity, and location
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-bold mb-1">QR Code Auto-Generated</h3>
                <p className="text-sm text-gray-600">
                  Each table gets a unique QR code automatically
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-purple-200">
            <Link href={`/${locale}/dashboard/tables`} target="_blank">
              <Button className="w-full bg-purple-600 hover:bg-purple-700 gap-2">
                <Plus size={16} />
                Open Tables Page
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> You can add tables now or skip this step and add them later from your dashboard.
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
