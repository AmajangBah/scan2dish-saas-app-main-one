"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Phone, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { updateBusinessProfile, getRestaurantProfile } from "@/app/actions/restaurant";
import { getCurrencyOptions } from "@/lib/utils/currency";

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

export default function BusinessProfile() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    currency: "GMD" as Currency,
  });

  const currencyOptions = getCurrencyOptions();

  // Load restaurant profile on mount
  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      const result = await getRestaurantProfile();
      if (result.success && result.data) {
        const data = result.data as
          | { name?: string; phone?: string; email?: string; currency?: Currency }
          | null;
        setFormData((prev) => ({
          ...prev,
          name: data?.name || "",
          phone: data?.phone || "",
          email: data?.email || "",
          currency: data?.currency || "GMD",
        }));
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setSuccess(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const result = await updateBusinessProfile({
      name: formData.name,
      phone: formData.phone || null,
      currency: formData.currency,
    });

    setSaving(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || "Failed to save changes");
    }
  };
  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn p-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Business Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your restaurant details, branding and public information.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          ✓ Changes saved successfully!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Restaurant Name *</Label>
                <Input
                  name="name"
                  placeholder="Scan2Dish Restaurant"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Business Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="email"
                    className="pl-10"
                    placeholder="restaurant@email.com"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled
                    title="Email cannot be changed here"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Contact support to change your email
                </p>
              </div>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="phone"
                    className="pl-10"
                    placeholder="(+220) 123 4567"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Currency *</Label>
                <select
                  name="currency"
                  className="w-full p-2 border rounded-lg"
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      currency: e.target.value as Currency,
                    }))
                  }
                  required
                >
                  {currencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Used for menu prices and reports
                </p>
              </div>
            </div>

          </CardContent>
        </Card>

        <Button
          type="submit"
          className="mt-4 w-full md:w-auto"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
