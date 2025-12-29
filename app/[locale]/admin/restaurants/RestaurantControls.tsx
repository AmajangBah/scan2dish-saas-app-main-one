"use client";

/**
 * Restaurant Controls Component
 * Client-side controls for enabling/disabling restaurants
 */

import { useState } from "react";
import { Power, Ban } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Restaurant {
  id: string;
  name: string;
  menu_enabled: boolean;
  enforcement_reason: string | null;
}

export default function RestaurantControls({
  restaurant,
}: {
  restaurant: Restaurant;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState("");

  async function toggleStatus(enable: boolean) {
    if (!enable && !reason) {
      setShowDialog(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/restaurants/${restaurant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menu_enabled: enable,
          enforcement_reason: enable ? null : reason,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      toast.success(
        enable
          ? `${restaurant.name} menu enabled`
          : `${restaurant.name} menu disabled`
      );
      
      setShowDialog(false);
      setReason("");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update restaurant"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {restaurant.menu_enabled ? (
        <button
          onClick={() => setShowDialog(true)}
          disabled={isLoading}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
          title="Disable Menu"
        >
          <Ban className="h-4 w-4" />
        </button>
      ) : (
        <button
          onClick={() => toggleStatus(true)}
          disabled={isLoading}
          className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
          title="Enable Menu"
        >
          <Power className="h-4 w-4" />
        </button>
      )}

      {/* Disable Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Disable Restaurant Menu
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This will prevent customers from viewing the menu and placing
              orders for <span className="font-medium">{restaurant.name}</span>.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (required)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Unpaid commission, Policy violation..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDialog(false);
                  setReason("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => toggleStatus(false)}
                disabled={!reason || isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Disable Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
