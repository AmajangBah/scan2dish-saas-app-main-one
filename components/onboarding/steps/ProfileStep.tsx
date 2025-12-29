"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Building2 } from "lucide-react";
import { updateBusinessProfile } from "@/app/actions/restaurant";
import { getCurrencyOptions } from "@/lib/utils/currency";

interface ProfileStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function ProfileStep({ onNext, onBack }: ProfileStepProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    currency: "GMD",
    brandColor: "#C84501",
  });

  const currencyOptions = getCurrencyOptions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const result = await updateBusinessProfile({
      name: formData.name,
      phone: formData.phone || null,
      currency: formData.currency as any,
      brand_color: formData.brandColor,
    });

    setSaving(false);

    if (result.success) {
      onNext();
    } else {
      setError(result.error || "Failed to save profile");
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold">Set Up Your Restaurant Profile</h2>
        <p className="text-gray-600">
          Tell us about your restaurant so we can personalize your experience
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Restaurant Name *</Label>
          <Input
            id="name"
            placeholder="e.g., Joe's Burger Joint"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+220 123 4567"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <p className="text-xs text-gray-500">
            Customers can call if they need assistance
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency *</Label>
          <select
            id="currency"
            className="w-full p-2 border rounded-lg"
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            required
          >
            {currencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">
            This will be used for all menu prices
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="brandColor">Brand Color</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              id="brandColor"
              value={formData.brandColor}
              onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
              className="w-12 h-12 rounded-lg cursor-pointer border"
            />
            <Input
              type="text"
              placeholder="#C84501"
              value={formData.brandColor}
              onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
            />
          </div>
          <p className="text-xs text-gray-500">
            Your brand color will appear in the customer menu
          </p>
        </div>

        <div className="flex justify-between items-center pt-6">
          <Button
            type="button"
            onClick={onBack}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>

          <Button
            type="submit"
            disabled={saving || !formData.name}
            className="bg-[#C84501] hover:bg-orange-700 gap-2"
          >
            {saving ? "Saving..." : "Continue"}
            <ArrowRight size={16} />
          </Button>
        </div>
      </form>
    </div>
  );
}
