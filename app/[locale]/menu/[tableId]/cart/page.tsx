"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CartItem from "../../components/CartItem";
import { useCart } from "../../context/CartContext";
import { formatPrice } from "@/lib/utils/currency";
import { useMenuRestaurant } from "../../context/MenuRestaurantContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function CartPage() {
  const { tableId } = useParams();
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const [payNow, setPayNow] = useState(false);
  const { currency } = useMenuRestaurant();

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
    <div className="px-4 pt-6 pb-10">
      <div className="max-w-xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold tracking-tight">Your cart</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Review items, then place your order.
            </p>
          </div>
          {tableId && typeof tableId === "string" && (
            <Button asChild variant="outline" className="shrink-0">
              <Link href={`/menu/${tableId}/browse`}>Add items</Link>
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {items.length === 0 && (
            <Card className="p-6 text-center">
              <div className="text-base font-semibold">Your cart is empty</div>
              <p className="text-sm text-muted-foreground mt-1">
                Add a few items to place an order.
              </p>
              {tableId && typeof tableId === "string" && (
                <Button
                  asChild
                  className="mt-4 bg-[var(--menu-brand)] text-white hover:bg-[var(--menu-brand)]/90"
                >
                  <Link href={`/menu/${tableId}/browse`}>Browse menu</Link>
                </Button>
              )}
            </Card>
          )}

          {items.map((it) => (
            <CartItem key={it.id} item={it} />
          ))}
        </div>

        <Card className="mt-6 p-4 rounded-2xl">
          <div className="flex justify-between py-2">
            <div className="text-lg font-medium">Subtotal</div>
            <div className="font-semibold">{formatPrice(subtotal, currency)}</div>
          </div>

          <div className="flex justify-between py-2">
            <div className="text-sm text-muted-foreground">VAT</div>
            <div className="font-medium">{formatPrice(VAT, currency)}</div>
          </div>

          <div className="flex justify-between py-2">
            <div className="text-sm text-muted-foreground">Tip fee</div>
            <div className="font-medium">{formatPrice(tip, currency)}</div>
          </div>

          <hr className="my-3" />

          <div className="flex justify-between items-center">
            <div>
              <div className="text-lg font-semibold">Total</div>
              <div className="text-sm text-gray-500">{formatPrice(total, currency)}</div>
            </div>

            <div className="flex flex-col items-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={payNow}
                  onChange={() => setPayNow(!payNow)}
                  className="w-4 h-4"
                />{" "}
                Pay now
              </label>

              {error && (
                <div className="text-red-600 text-sm mb-2">{error}</div>
              )}
              <Button
                onClick={placeOrder}
                disabled={isPlacingOrder || items.length === 0}
                className="mt-3 w-48 bg-[var(--menu-brand)] text-white hover:bg-[var(--menu-brand)]/90"
              >
                {isPlacingOrder ? "Placing Order..." : "Place Order"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
