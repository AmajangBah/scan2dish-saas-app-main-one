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

type MenuItem = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  images?: string[] | null;
  available?: boolean | null;
};

export default function MenuItemPage() {
  const { tableId, itemId } = useParams();
  const { add } = useCart();
  const { currency, restaurantId } = useMenuRestaurant();

  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<MenuItem | null>(null);

  const firstImage = useMemo(() => item?.images?.[0], [item?.images]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);

        if (!itemId || typeof itemId !== "string") {
          throw new Error("Invalid item");
        }
        if (!restaurantId) {
          throw new Error("Missing restaurant context");
        }

        const supabase = createBrowserSupabase();
        const { data, error: e } = await supabase
          .from("menu_items")
          .select("id, name, description, price, images, available")
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
          <Link href={`/menu/${tableId}/browse`}>Back to menu</Link>
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
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[var(--menu-brand)]/15 to-muted" />
              )}
            </div>
            <div className="p-5 space-y-3">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">{item.name}</h1>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.description}
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
                onClick={() => add({ id: item.id, name: item.name, price: item.price }, qty)}
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
