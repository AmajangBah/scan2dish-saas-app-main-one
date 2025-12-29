"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils/currency";

export default function CheckoutPage() {
  const { tableId } = useParams();
  const router = useRouter();
  const { items, subtotal, clear } = useCart();

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");

  const place = async () => {
    if (!tableId || typeof tableId !== "string") {
      setError("Invalid table ID");
      return;
    }

    if (items.length === 0) {
      setError("Cart is empty");
      return;
    }

    setIsPlacingOrder(true);
    setError(null);

    try {
      const { createOrder } = await import("@/app/actions/orders");
      
      const result = await createOrder({
        table_id: tableId,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,
          image: item.image,
        })),
        customer_name: customerName.trim() ? customerName.trim() : null,
        notes: notes.trim() ? notes.trim() : null,
      });

      if (result.success && result.orderId) {
        clear();
        router.push(`/menu/${tableId}/order/${result.orderId}`);
      } else {
        setError(result.error || "Failed to place order");
      }
    } catch (err) {
      console.error("Order placement error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="pb-28 px-4 pt-6">
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Checkout</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Your Name (optional)
          </label>
          <input
            className="w-full p-3 rounded-xl bg-gray-100"
            placeholder="Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Notes (optional)
          </label>
          <textarea
            className="w-full p-3 rounded-xl bg-gray-100"
            placeholder="Extra ketchup?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-xl font-semibold">{formatPrice(subtotal, "GMD")}</div>
            </div>

            {error && (
              <div className="text-red-600 text-sm mb-2">{error}</div>
            )}
            <Button
              onClick={place}
              disabled={isPlacingOrder || items.length === 0}
              className="bg-orange-600 text-white py-3 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlacingOrder ? "Placing Order..." : "Place Order"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
