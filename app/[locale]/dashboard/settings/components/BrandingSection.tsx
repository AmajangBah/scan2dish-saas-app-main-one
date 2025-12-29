"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { updateBranding, getRestaurantProfile } from "@/app/actions/restaurant";

export default function BrandingPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#C84501");

  // Load current brand color
  useEffect(() => {
    async function loadBranding() {
      setLoading(true);
      const result = await getRestaurantProfile();
      if (result.success && result.data) {
        const data = result.data as any;
        setPrimaryColor(data.brand_color || "#C84501");
      }
      setLoading(false);
    }
    loadBranding();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const result = await updateBranding({
      brand_color: primaryColor,
    });

    setSaving(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || "Failed to save branding");
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
        <h1 className="text-2xl font-semibold tracking-tight">Branding</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customize your restaurant's visual identity and how your customers see
          your brand.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          ✓ Branding updated successfully!
        </div>
      )}

      <form onSubmit={handleSave}>
        <Card className="border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Brand Color</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This primary color is stored in your restaurant record and is used
              across customer-facing UI.
            </p>
            <div className="space-y-2">
              <Label>Primary Color *</Label>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border overflow-hidden">
                  <input
                    type="color"
                    className="w-full h-full cursor-pointer"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                  />
                </div>
                <Input
                  type="text"
                  placeholder="#C84501"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  title="Enter a valid hex color (e.g., #C84501)"
                />
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
