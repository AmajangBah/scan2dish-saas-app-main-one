"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, QrCode, Download, Printer } from "lucide-react";

interface QRStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function QRStep({ onNext, onBack }: QRStepProps) {
  return (
    <div className="space-y-8 py-4">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <QrCode className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold">Generate & Print QR Codes</h2>
        <p className="text-gray-600">
          Each table has a unique QR code for customers to scan
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-2xl border border-indigo-200">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-bold mb-1">View QR Codes</h3>
                <p className="text-sm text-gray-600">
                  Go to Tables page → Click "View QR" on any table
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-bold mb-1">Download QR Codes</h3>
                <p className="text-sm text-gray-600">
                  Click "Download QR" to save as PNG image (high resolution)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-bold mb-1">Print & Display</h3>
                <p className="text-sm text-gray-600">
                  Print QR codes and place them on tables (table tents, stickers, or frames work great!)
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white rounded-lg border-2 border-dashed border-indigo-300">
            <div className="text-center">
              <QrCode className="w-16 h-16 mx-auto text-indigo-600 mb-3" />
              <p className="text-sm font-medium">Sample QR Code</p>
              <p className="text-xs text-gray-500 mt-1">
                Each table gets a unique code like this
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Download className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-blue-900">Download Tips</p>
                <p className="text-xs text-blue-700 mt-1">
                  Save as PNG for best print quality. Size: 500x500px recommended
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Printer className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-blue-900">Print Tips</p>
                <p className="text-xs text-blue-700 mt-1">
                  Print at 3x3 inches minimum. Laminate for durability!
                </p>
              </div>
            </div>
          </div>
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
