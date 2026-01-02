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
import { createBrowserSupabase } from "@/lib/supabase/client";

function pickTranslatedText({
  locale,
  base,
  translations,
}: {
  locale: string | null;
  base: string;
  translations: unknown;
}) {
  if (!locale || locale === "en") return base;
  if (!translations || typeof translations !== "object" || Array.isArray(translations)) {
    return base;
  }
  const v = (translations as Record<string, unknown>)[locale];
  return typeof v === "string" && v.trim() ? v : base;
}

export default function CheckoutPage() {
  const params = useParams();
  const locale = typeof params.locale === "string" ? params.locale : null;
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const { currency, restaurantName, tableNumber, restaurantId, tableId, tableSlug } =
    useMenuRestaurant();
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
  const [pricingLoading, setPricingLoading] = useState(false);

  const [displayNameById, setDisplayNameById] = useState<Record<string, string>>(
    {}
  );

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
        setPricingLoading(false);
        return;
      }
      setPricingLoading(true);
      setPricing(null);
      await new Promise((r) => setTimeout(r, 200));
      if (cancelled) return;

      const res = await previewOrderPricing(pricingInput);
      if (cancelled) return;
      if (res.success) setPricing({ subtotal: res.subtotal, discount: res.discount, total: res.total });
      else setPricing(null);
      setPricingLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [pricingInput]);

  useEffect(() => {
    let cancelled = false;
    async function loadNames() {
      try {
        if (!restaurantId || items.length === 0) {
          setDisplayNameById({});
          return;
        }

        const supabase = createBrowserSupabase();
        const ids = items.map((i) => i.id);
        const { data, error } = await supabase
          .from("menu_items")
          .select("id, name, name_translations")
          .eq("restaurant_id", restaurantId)
          .in("id", ids);

        if (error) {
          setDisplayNameById({});
          return;
        }

        const map: Record<string, string> = {};
        for (const row of data ?? []) {
          const baseName = String((row as unknown as { name?: unknown }).name ?? "");
          if (!baseName) continue;
          map[String((row as unknown as { id?: unknown }).id)] = pickTranslatedText({
            locale,
            base: baseName,
            translations: (row as unknown as { name_translations?: unknown }).name_translations,
          });
        }

        if (!cancelled) setDisplayNameById(map);
      } catch {
        if (!cancelled) setDisplayNameById({});
      }
    }

    loadNames();
    return () => {
      cancelled = true;
    };
  }, [items, restaurantId, locale]);

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
          name: displayNameById[item.id] || item.name,
          price: item.price,
          qty: item.qty,
          image: item.image,
        })),
        customer_name: customerName.trim() ? customerName.trim() : null,
        notes: notes.trim() ? notes.trim() : null,
      });

      if (result.success && result.orderId) {
        clear();
        router.push(`${base}/menu/${tableSlug}/order/${result.orderId}?success=1`);
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
    <div className="px-4 pt-6 pb-10 bg-gradient-to-b from-[var(--menu-brand)]/10 via-background to-background">
      <div className="max-w-xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold tracking-tight">Checkout</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {restaurantName} • Table {tableNumber}
            </p>
          </div>
          {tableSlug && (
            <Button asChild variant="outline" className="shrink-0">
              <Link href={`${base}/menu/${tableSlug}/cart`}>Back</Link>
            </Button>
          )}
        </div>

        {items.length === 0 && tableSlug && (
          <Card className="p-6 rounded-2xl">
            <div className="text-base font-semibold">Your cart is empty</div>
            <p className="text-sm text-muted-foreground mt-1">
              Add items before sending an order.
            </p>
            <Button
              asChild
              className="mt-4 bg-[var(--menu-brand)] text-white hover:bg-[var(--menu-brand)]/90"
            >
              <Link href={`${base}/menu/${tableSlug}/browse`}>Browse menu</Link>
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
                          {it.qty}× {displayNameById[it.id] || it.name}
                        </span>
                        <span className="font-medium">
                          {formatPrice(it.price * it.qty, currency)}
                        </span>
                      </div>
                    ))}
                    {tableSlug && (
                      <div className="pt-2">
                        <Button asChild variant="outline" size="sm" className="rounded-full">
                          <Link href={`${base}/menu/${tableSlug}/cart`}>Edit cart</Link>
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
                  {formatPrice(pricingLoading ? subtotal : (pricing?.total ?? subtotal), currency)}
                </div>
                {(pricing?.discount ?? 0) > 0 && (
                  <div className="text-xs text-emerald-700 mt-1">
                    Discount applied: −{formatPrice(pricing?.discount ?? 0, currency)}
                  </div>
                )}
                {pricingLoading && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Updating totals…
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
