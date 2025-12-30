"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils/currency";
import { useMenuRestaurant } from "../../context/MenuRestaurantContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function CheckoutPage() {
  const { tableId } = useParams();
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const { currency } = useMenuRestaurant();

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
    <div className="px-4 pt-6 pb-10">
      <div className="max-w-xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold tracking-tight">Checkout</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Optional details help the staff serve you faster.
            </p>
          </div>
          {tableId && typeof tableId === "string" && (
            <Button asChild variant="outline" className="shrink-0">
              <Link href={`/menu/${tableId}/cart`}>Back</Link>
            </Button>
          )}
        </div>

        <Card className="p-4 rounded-2xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Your name (optional)
              </label>
              <Input
                placeholder="e.g., Awa"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Notes (optional)
              </label>
              <Textarea
                placeholder="Allergies, preferences, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <div>
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-xl font-semibold">
                  {formatPrice(subtotal, currency)}
                </div>
              </div>

              <div className="flex flex-col items-end">
                {error && (
                  <div className="text-destructive text-sm mb-2">{error}</div>
                )}
                <Button
                  onClick={place}
                  disabled={isPlacingOrder || items.length === 0}
                  className="bg-[var(--menu-brand)] text-white hover:bg-[var(--menu-brand)]/90"
                >
                  {isPlacingOrder ? "Placing Order..." : "Place Order"}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
