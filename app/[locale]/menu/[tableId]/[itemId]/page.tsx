"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import QuantitySelector from "../../components/QuantitySelector";
import { useCart } from "../../context/CartContext";
import { useMenuRestaurant } from "../../context/MenuRestaurantContext";
import { formatPrice } from "@/lib/utils/currency";

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

type MenuItem = {
  id: string;
  name: string;
  description?: string | null;
  name_translations?: unknown;
  description_translations?: unknown;
  price: number;
  images?: string[] | null;
  available?: boolean | null;
};

export default function MenuItemPage() {
  const params = useParams();
  const tableId = typeof params.tableId === "string" ? params.tableId : null;
  const itemId = typeof params.itemId === "string" ? params.itemId : null;
  const locale = typeof params.locale === "string" ? params.locale : null;
  const { add } = useCart();
  const { currency, restaurantId } = useMenuRestaurant();
  const base = locale ? `/${locale}` : "";

  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<MenuItem | null>(null);

  const displayName = useMemo(() => {
    if (!item) return "";
    return pickTranslatedText({
      locale,
      base: String(item.name),
      translations: item.name_translations,
    });
  }, [item, locale]);

  const displayDescription = useMemo(() => {
    const baseText = item?.description ? String(item.description) : "";
    if (!baseText) return "";
    return pickTranslatedText({
      locale,
      base: baseText,
      translations: item?.description_translations,
    });
  }, [item, locale]);

  const firstImage = useMemo(() => item?.images?.[0], [item?.images]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);

        if (!itemId) {
          throw new Error("Invalid item");
        }
        if (!restaurantId) {
          throw new Error("Missing restaurant context");
        }

        const supabase = createBrowserSupabase();
        const { data, error: e } = await supabase
          .from("menu_items")
          .select(
            "id, name, description, name_translations, description_translations, price, images, available"
          )
          .eq("restaurant_id", restaurantId)
          .eq("id", itemId)
          .single();

        if (e || !data) throw new Error("Item not found");
        if (!cancelled) setItem(data as unknown as MenuItem);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load item");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [itemId, restaurantId]);

  return (
    <div className="px-4 pt-6 pb-10 bg-background min-h-dvh">
      <div className="max-w-xl mx-auto space-y-4">
        <Button asChild variant="outline" className="rounded-xl">
          <Link href={tableId ? `${base}/menu/${tableId}/browse` : `${base}/menu`}>
            Back to menu
          </Link>
        </Button>

        {loading && (
          <Card className="p-6 rounded-2xl">
            <div className="text-sm text-muted-foreground">Loading…</div>
          </Card>
        )}

        {!loading && error && (
          <Card className="p-6 rounded-2xl">
            <div className="text-sm text-destructive">{error}</div>
          </Card>
        )}

        {!loading && !error && item && (
          <Card className="overflow-hidden rounded-2xl">
            <div className="aspect-[16/9] bg-muted">
              {firstImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={firstImage}
                  alt={displayName || item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[var(--menu-brand)]/15 to-muted" />
              )}
            </div>
            <div className="p-5 space-y-3">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  {displayName}
                </h1>
                {displayDescription && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {displayDescription}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Price</div>
                <div className="font-semibold">{formatPrice(item.price, currency)}</div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Quantity</div>
                <QuantitySelector value={qty} onChange={setQty} />
              </div>

              <div className="pt-2 border-t flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="font-semibold">
                  {formatPrice(item.price * qty, currency)}
                </div>
              </div>

              <Button
                className="w-full bg-[var(--menu-brand)] text-white hover:bg-[var(--menu-brand)]/90"
                onClick={() =>
                  add({ id: item.id, name: displayName, price: item.price }, qty)
                }
              >
                Add to cart
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
