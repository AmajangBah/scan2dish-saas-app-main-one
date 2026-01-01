"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectContent,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { getCurrencyOptions } from "@/lib/utils/currency";
import { getRestaurantProfile, updateBusinessProfile } from "@/app/actions/restaurant";

type Currency =
  | "USD"
  | "EUR"
  | "GBP"
  | "GMD"
  | "XOF"
  | "NGN"
  | "GHS"
  | "ZAR"
  | "KES";

export default function PreferencesSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<Currency>("GMD");
  const [brandColor, setBrandColor] = useState("#C84501");

  const currencyOptions = getCurrencyOptions();

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      const result = await getRestaurantProfile();
      if (result.success && result.data) {
        const data = result.data as
          | { name?: string; currency?: Currency; brand_color?: string }
          | null;
        setName(data?.name || "");
        setCurrency(data?.currency || "GMD");
        setBrandColor(data?.brand_color || "#C84501");
      } else {
        setError(result.error || "Failed to load preferences");
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    const result = await updateBusinessProfile({
      name,
      currency,
      brand_color: brandColor,
    });

    setSaving(false);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } else {
      setError(result.error || "Failed to save changes");
    }
  };

  return (
    <div className="p-6 space-y-10 max-w-md">
      <h2 className="text-2xl font-semibold">Preferences</h2>

      {loading && (
        <div className="text-sm text-gray-500">Loading…</div>
      )}
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
      {success && (
        <div className="text-sm text-green-700">✓ Saved</div>
      )}

      {/* Currency */}
      <div className="space-y-2">
        <Label>Currency</Label>
        <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
          <SelectTrigger>
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            {currencyOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Brand Color */}
      <div className="space-y-2">
        <Label>Customer UI Primary Color</Label>
        <Input
          type="color"
          className="h-12 w-24 p-0 border-none"
          value={brandColor}
          onChange={(e) => setBrandColor(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          This color will be applied to buttons and headers on the customer
          page.
        </p>
      </div>

      <Button className="w-full mt-4" onClick={handleSave} disabled={saving || loading}>
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
