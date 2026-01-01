"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CartItem from "../../components/CartItem";
import { useCart } from "../../context/CartContext";
import { formatPrice } from "@/lib/utils/currency";
import { useMenuRestaurant } from "../../context/MenuRestaurantContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card } from "@/components/ui/card";
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

export default function CartPage() {
  const params = useParams();
  const locale = typeof params.locale === "string" ? params.locale : null;
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const { currency, restaurantId, tableId, tableSlug } = useMenuRestaurant();
  const base = locale ? `/${locale}` : "";

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
      // Prevent stale totals: show instant local subtotal while pricing recalculates.
      setPricingLoading(true);
      setPricing(null);

      // Small debounce to avoid hammering server actions on rapid +/- taps.
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

  // Keep cart item names in-sync with the selected locale (for display + order payload).
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

  const goToCheckout = () => {
    if (!tableSlug) return;
    router.push(`${base}/menu/${tableSlug}/checkout`);
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
          {tableSlug && (
            <Button asChild variant="outline" className="shrink-0">
              <Link href={`${base}/menu/${tableSlug}/browse`}>Add items</Link>
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
              {tableSlug && (
                <Button
                  asChild
                  className="mt-4 bg-[var(--menu-brand)] text-white hover:bg-[var(--menu-brand)]/90"
                >
                  <Link href={`${base}/menu/${tableSlug}/browse`}>Browse menu</Link>
                </Button>
              )}
            </Card>
          )}

          {items.map((it) => (
            <CartItem
              key={it.id}
              item={{ ...it, name: displayNameById[it.id] || it.name }}
            />
          ))}
        </div>

        <Card className="mt-6 p-4 rounded-2xl">
          <div className="flex justify-between py-2">
            <div className="text-lg font-medium">Subtotal</div>
            <div className="font-semibold">
              {formatPrice(pricingLoading ? subtotal : (pricing?.subtotal ?? subtotal), currency)}
            </div>
          </div>

          {(pricing?.discount ?? 0) > 0 && (
            <div className="flex justify-between py-2">
              <div className="text-sm text-muted-foreground">Discount</div>
              <div className="font-medium text-emerald-700">
                −{formatPrice(pricing?.discount ?? 0, currency)}
              </div>
            </div>
          )}

          <hr className="my-3" />

          <div className="flex justify-between items-center">
            <div>
              <div className="text-lg font-semibold">Total</div>
              <div className="text-sm text-gray-500">
                {formatPrice(pricingLoading ? subtotal : (pricing?.total ?? subtotal), currency)}
              </div>
              {pricingLoading && (
                <div className="text-xs text-muted-foreground mt-1">
                  Updating totals…
                </div>
              )}
            </div>

            <div className="flex flex-col items-end">
              <Button
                onClick={goToCheckout}
                disabled={items.length === 0}
                className="mt-3 w-48 bg-[var(--menu-brand)] text-white hover:bg-[var(--menu-brand)]/90"
              >
                Continue to checkout
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="mt-1 text-muted-foreground"
                onClick={clear}
                disabled={items.length === 0}
              >
                Clear cart
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
