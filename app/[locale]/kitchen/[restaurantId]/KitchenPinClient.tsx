"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { kitchenVerifyPin } from "@/app/actions/kitchen";

export default function KitchenPinClient({
  restaurantId,
  restaurantName,
}: {
  restaurantId: string;
  restaurantName: string;
}) {
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await kitchenVerifyPin({ restaurantId, pin });
      if (!res.success) {
        setError(res.error || "Incorrect PIN");
        return;
      }
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to verify PIN");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-black text-white flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-6 bg-neutral-950 border-neutral-800">
        <div className="space-y-2">
          <div className="text-xs tracking-wide text-neutral-400 uppercase">
            Kitchen Access
          </div>
          <div className="text-2xl font-semibold">{restaurantName}</div>
          <div className="text-sm text-neutral-400">
            Enter the kitchen PIN to continue.
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <Input
            inputMode="numeric"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder="PIN"
            className="h-12 text-lg bg-black border-neutral-800 text-white placeholder:text-neutral-500"
          />
          {error && <div className="text-sm text-red-400">{error}</div>}
          <Button
            type="button"
            onClick={submit}
            disabled={submitting || pin.length < 4}
            className="w-full h-12 text-base font-semibold bg-white text-black hover:bg-neutral-200"
          >
            {submitting ? "Checking…" : "Unlock Kitchen"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

