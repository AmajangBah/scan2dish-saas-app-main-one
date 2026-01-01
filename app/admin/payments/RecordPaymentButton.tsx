"use client";

/**
 * Record Payment Dialog
 * Client-side form for recording commission payments
 */

import { useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Restaurant {
  id: string;
  name: string;
  total_commission_owed: number;
  total_commission_paid: number;
}

export default function RecordPaymentButton({
  restaurants,
}: {
  restaurants: Restaurant[];
}) {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    restaurant_id: "",
    send_receipt: true,
    amount: "",
    payment_method: "cash",
    reference_number: "",
    notes: "",
  });

  const selectedRestaurant = restaurants.find(
    (r) => r.id === formData.restaurant_id
  );
  const balance = selectedRestaurant
    ? selectedRestaurant.total_commission_owed -
      selectedRestaurant.total_commission_paid
    : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      toast.success("Payment recorded successfully");
      setShowDialog(false);
      setFormData({
        restaurant_id: "",
        send_receipt: true,
        amount: "",
        payment_method: "cash",
        reference_number: "",
        notes: "",
      });
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to record payment"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
      >
        <Plus className="h-4 w-4" />
        Record Payment
      </button>

      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Record Commission Payment
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Restaurant Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Restaurant *
                </label>
                <select
                  required
                  value={formData.restaurant_id}
                  onChange={(e) =>
                    setFormData({ ...formData, restaurant_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select a restaurant...</option>
                  {restaurants.map((restaurant) => {
                    const balance =
                      restaurant.total_commission_owed -
                      restaurant.total_commission_paid;
                    return (
                      <option key={restaurant.id} value={restaurant.id}>
                        {restaurant.name} (Balance: ${balance.toFixed(2)})
                      </option>
                    );
                  })}
                </select>
                {selectedRestaurant && (
                  <p className="text-sm text-gray-600 mt-1">
                    Current balance: ${balance.toFixed(2)}
                  </p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Send receipt */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.send_receipt}
                    onChange={(e) =>
                      setFormData({ ...formData, send_receipt: e.target.checked })
                    }
                    className="mt-1"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Send receipt to restaurant dashboard
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      The restaurant will see this payment under Billing → Receipts and can print/download it.
                    </div>
                  </div>
                </label>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method *
                </label>
                <select
                  required
                  value={formData.payment_method}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_method: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={formData.reference_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reference_number: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Optional transaction reference"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  placeholder="Optional notes about this payment..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  {isLoading ? "Recording..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
