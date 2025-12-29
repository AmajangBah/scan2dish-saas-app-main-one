"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CartItem from "../../components/CartItem";
import { useCart } from "../../context/CartContext";
import { formatPrice } from "@/lib/utils/currency";

export default function CartPage() {
  const { tableId } = useParams();
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const [payNow, setPayNow] = useState(false);

  // Note: These are for display only. Actual prices are calculated server-side
  const VAT = Math.round(subtotal * 0.1);
  const tip = Math.round(subtotal * 0.03);
  const total = subtotal + VAT + tip;

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeOrder = async () => {
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
        <h2 className="text-2xl font-bold mb-4">Cart</h2>

        <div className="space-y-4">
          {items.length === 0 && (
            <div className="text-center text-gray-500 py-10">
              Your cart is empty
            </div>
          )}

          {items.map((it) => (
            <CartItem key={it.id} item={it} />
          ))}
        </div>

        <div className="mt-6 bg-white p-4 rounded-2xl shadow-sm">
          <div className="flex justify-between py-2">
            <div className="text-lg font-medium">Subtotal</div>
            <div className="font-semibold">{formatPrice(subtotal, "GMD")}</div>
          </div>

          <div className="flex justify-between py-2">
            <div className="text-sm text-gray-600">VAT</div>
            <div className="font-medium">{formatPrice(VAT, "GMD")}</div>
          </div>

          <div className="flex justify-between py-2">
            <div className="text-sm text-gray-600">Tip fee</div>
            <div className="font-medium">{formatPrice(tip, "GMD")}</div>
          </div>

          <hr className="my-3" />

          <div className="flex justify-between items-center">
            <div>
              <div className="text-lg font-semibold">Total</div>
              <div className="text-sm text-gray-500">{formatPrice(total, "GMD")}</div>
            </div>

            <div className="flex flex-col items-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={payNow}
                  onChange={() => setPayNow(!payNow)}
                  className="w-10 h-6"
                />{" "}
                Pay now
              </label>

              {error && (
                <div className="text-red-600 text-sm mb-2">{error}</div>
              )}
              <button
                onClick={placeOrder}
                disabled={isPlacingOrder || items.length === 0}
                className="mt-3 w-48 bg-orange-600 text-white py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlacingOrder ? "Placing Order..." : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
