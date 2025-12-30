"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getKitchenSettings, updateKitchenSettings } from "@/app/actions/restaurantKitchen";
import { toast } from "sonner";

export default function KitchenSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [restaurantId, setRestaurantId] = useState<string>("");
  const [enabled, setEnabled] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState("");

  const kitchenUrl = useMemo(() => {
    if (!restaurantId) return "";
    return `${typeof window !== "undefined" ? window.location.origin : ""}/kitchen/${restaurantId}`;
  }, [restaurantId]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      const res = await getKitchenSettings();
      if (!res.success || !res.data) {
        setError(res.error || "Failed to load kitchen settings");
        setLoading(false);
        return;
      }
      setRestaurantId(res.data.restaurantId);
      setEnabled(res.data.kitchenEnabled);
      setPinEnabled(res.data.pinEnabled);
      setLoading(false);
    }
    load();
  }, []);

  const save = async (next: { kitchen_enabled: boolean; pin?: string | null }) => {
    setSaving(true);
    setError(null);
    const res = await updateKitchenSettings(next);
    setSaving(false);
    if (!res.success) {
      setError(res.error || "Failed to save");
      return;
    }
    toast.success("Kitchen settings saved");
    // Re-load to reflect pinEnabled state
    const refreshed = await getKitchenSettings();
    if (refreshed.success && refreshed.data) {
      setEnabled(refreshed.data.kitchenEnabled);
      setPinEnabled(refreshed.data.pinEnabled);
      setRestaurantId(refreshed.data.restaurantId);
    }
    setPin("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Kitchen</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Share a kitchen-only link with staff. No accounts required.
        </p>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {error && <div className="text-sm text-destructive">{error}</div>}

      {!loading && (
        <div className="grid gap-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Kitchen Mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium">Enable Kitchen Mode</div>
                  <div className="text-sm text-muted-foreground">
                    Allows kitchen staff to view and update order status.
                  </div>
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={(v) => {
                    setEnabled(v);
                    save({ kitchen_enabled: v });
                  }}
                  disabled={saving}
                />
              </div>

              {enabled && (
                <div className="space-y-3">
                  <div className="text-sm font-medium">Kitchen URL</div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input value={kitchenUrl} readOnly />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(kitchenUrl);
                          toast.success("Kitchen URL copied");
                        } catch {
                          toast.error("Failed to copy");
                        }
                      }}
                      disabled={!kitchenUrl}
                    >
                      Copy
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Share this link with kitchen staff. Consider enabling a PIN for extra protection.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {enabled && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">PIN Protection (optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">Require PIN</div>
                    <div className="text-sm text-muted-foreground">
                      Kitchen staff will enter the PIN once per session.
                    </div>
                  </div>
                  <Switch
                    checked={pinEnabled}
                    onCheckedChange={(v) => {
                      setPinEnabled(v);
                      if (!v) {
                        save({ kitchen_enabled: true, pin: null });
                      }
                    }}
                    disabled={saving}
                  />
                </div>

                {pinEnabled && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Set new PIN</div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        inputMode="numeric"
                        placeholder="4–8 digit PIN"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                      />
                      <Button
                        type="button"
                        onClick={() => save({ kitchen_enabled: true, pin })}
                        disabled={saving || pin.length < 4}
                      >
                        {saving ? "Saving…" : "Save PIN"}
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      PIN is stored as a secure hash. You can rotate it at any time.
                    </div>
                  </div>
                )}

                {!pinEnabled && (
                  <div className="text-sm text-muted-foreground">
                    PIN is currently <span className="font-medium">disabled</span>.
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

