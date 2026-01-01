"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Info, Plus } from "lucide-react";
import { createTable } from "@/app/actions/tables";
import type { Table } from "../types";

export default function AddTableDialog({
  open,
  setOpen,
  onSuccess,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  onSuccess?: (table: Table) => void;
}) {
  const router = useRouter();
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState("4");
  const [locationPreset, setLocationPreset] = useState("Main Floor");
  const [customLocation, setCustomLocation] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const location =
    locationPreset === "Custom" ? customLocation.trim() || "Main Floor" : locationPreset;

  const handleCreate = () => {
    if (!tableNumber.trim()) {
      setError("Table label is required.");
      return;
    }

    const capacityNum = parseInt(capacity);
    if (isNaN(capacityNum) || capacityNum <= 0) {
      setError("Capacity must be a positive number.");
      return;
    }
    if (capacityNum > 50) {
      setError("Capacity looks too high. Please double-check.");
      return;
    }
    if (locationPreset === "Custom" && !customLocation.trim()) {
      setError("Please enter a location name (or choose a preset).");
      return;
    }

    startTransition(async () => {
      const result = await createTable({
        table_number: tableNumber.trim(),
        capacity: capacityNum,
        location,
      });

      if (result.success && result.id) {
        const created: Table = {
          id: result.id,
          number: tableNumber.trim(),
          capacity: capacityNum,
          status: "available",
          location,
          qrAssigned: true,
          qrScans: 0,
        };

        setTableNumber("");
        setCapacity("4");
        setLocationPreset("Main Floor");
        setCustomLocation("");
        setError(null);
        setOpen(false);
        toast.success("Table created");
        onSuccess?.(created);
        // Ensure any server-fetched parts of the page (counts, etc.) update too.
        router.refresh();
      } else {
        setError(result.error || "Failed to create table");
        toast.error(result.error || "Failed to create table");
      }
    });
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl">
          <Plus className="h-4 w-4 mr-2" /> Add Table
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Create a table</DialogTitle>
          <DialogDescription>
            We’ll generate a QR code for this table so guests can scan and open the menu.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-5 py-4">
          <div className="space-y-2">
            <Label>Table label *</Label>
            <Input
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="e.g., 12 or Patio 2"
            />
            <p className="text-xs text-muted-foreground">
              What staff and guests will recognize. This also appears on the QR.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Capacity *</Label>
              <Input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                min="1"
                inputMode="numeric"
                placeholder="e.g., 4"
              />
              <p className="text-xs text-muted-foreground">
                Used for planning and reporting.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Location *</Label>
              <Select value={locationPreset} onValueChange={setLocationPreset}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Main Floor">Main Floor</SelectItem>
                  <SelectItem value="Patio">Patio</SelectItem>
                  <SelectItem value="Bar Area">Bar Area</SelectItem>
                  <SelectItem value="Private Room">Private Room</SelectItem>
                  <SelectItem value="Custom">Custom…</SelectItem>
                </SelectContent>
              </Select>

              {locationPreset === "Custom" && (
                <Input
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="e.g., Upstairs"
                />
              )}
              <p className="text-xs text-muted-foreground">
                Helps staff find the table quickly.
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/20 px-4 py-3 text-sm text-muted-foreground flex gap-2">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              After creating the table, use <span className="font-medium text-foreground">View QR</span> to download or copy the menu link.
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isPending} className="rounded-xl">
            {isPending ? "Creating..." : "Create Table"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
