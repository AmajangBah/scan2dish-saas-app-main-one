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
import { useEffect, useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { previewOrderPricing } from "@/app/actions/orderPricing";

export default function CheckoutPage() {
  const params = useParams();
  const tableId = typeof params.tableId === "string" ? params.tableId : null;
  const locale = typeof params.locale === "string" ? params.locale : null;
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const { currency, restaurantName, tableNumber } = useMenuRestaurant();
  const base = locale ? `/${locale}` : "";

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [pricing, setPricing] = useState<{
    subtotal: number;
    discount: number;
    total: number;
  } | null>(null);

  const pricingInput = useMemo(() => {
    if (!tableId) return null;
    if (items.length === 0) return null;
    return {
      table_id: tableId,
      items: items.map((i) => ({ id: i.id, qty: i.qty })),
    };
  }, [items, tableId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!pricingInput) {
        setPricing(null);
        return;
      }
      const res = await previewOrderPricing(pricingInput);
      if (cancelled) return;
      if (res.success) setPricing(res);
      else setPricing(null);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [pricingInput]);

  const appendNote = (text: string) => {
    setNotes((prev) => {
      const trimmed = prev.trim();
      const next = trimmed ? `${trimmed}\n${text}` : text;
      return next.slice(0, 500);
    });
  };

  const place = async () => {
    if (!tableId) {
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
        router.push(`${base}/menu/${tableId}/order/${result.orderId}`);
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
              {restaurantName} • Table {tableNumber}
            </p>
          </div>
          {tableId && (
            <Button asChild variant="outline" className="shrink-0">
              <Link href={`${base}/menu/${tableId}/cart`}>Back</Link>
            </Button>
          )}
        </div>

        {items.length === 0 && tableId && (
          <Card className="p-6 rounded-2xl">
            <div className="text-base font-semibold">Your cart is empty</div>
            <p className="text-sm text-muted-foreground mt-1">
              Add items before sending an order.
            </p>
            <Button
              asChild
              className="mt-4 bg-[var(--menu-brand)] text-white hover:bg-[var(--menu-brand)]/90"
            >
              <Link href={`${base}/menu/${tableId}/browse`}>Browse menu</Link>
            </Button>
          </Card>
        )}

        <Card className="p-4 rounded-2xl">
          <div className="space-y-4">
            <Accordion type="single" collapsible defaultValue="summary">
              <AccordionItem value="summary">
                <AccordionTrigger className="text-sm">
                  Order summary ({items.reduce((s, it) => s + it.qty, 0)} items)
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {items.map((it) => (
                      <div key={it.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {it.qty}× {it.name}
                        </span>
                        <span className="font-medium">
                          {formatPrice(it.price * it.qty, currency)}
                        </span>
                      </div>
                    ))}
                    {tableId && (
                      <div className="pt-2">
                        <Button asChild variant="outline" size="sm" className="rounded-full">
                          <Link href={`${base}/menu/${tableId}/cart`}>Edit cart</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

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
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  "No peanuts",
                  "Gluten-free",
                  "No spice",
                  "Extra spicy",
                  "No onions",
                  "No dairy",
                ].map((chip) => (
                  <Button
                    key={chip}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-full"
                    onClick={() => appendNote(chip)}
                  >
                    {chip}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <div>
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-xl font-semibold">
                  {formatPrice(pricing?.total ?? subtotal, currency)}
                </div>
                {(pricing?.discount ?? 0) > 0 && (
                  <div className="text-xs text-emerald-700 mt-1">
                    Discount applied: −{formatPrice(pricing?.discount ?? 0, currency)}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  You can edit your cart before sending.
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
                  {isPlacingOrder ? "Sending…" : "Send order to kitchen"}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
