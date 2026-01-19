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
import {
  classifyMenuType,
  supabaseCategoryOrForMenuType,
} from "../../utils/menuType";
import { toast } from "sonner";
import type { Locale } from "@/i18n";

const translations: Record<Locale, Record<string, string>> = {
  en: {
    yourCart: "Your cart",
    reviewItems: "Review items, then place your order.",
    addItems: "Add items",
    emptyCart: "Your cart is empty",
    addFewItems: "Add a few items to place an order.",
    browseMenu: "Browse menu",
    recommendedForYou: "Recommended for you",
    completeYourOrder: "Complete your order with one tap ✨",
    loading: "Loading…",
    subtotal: "Subtotal",
    discount: "Discount",
    total: "Total",
    continueCheckout: "Continue to checkout",
    clearCart: "Clear cart",
    add: "Add",
    updating: "Updating totals…",
    addedToCart: "Added to cart",
  },
  fr: {
    yourCart: "Votre panier",
    reviewItems: "Vérifiez les articles, puis commandez.",
    addItems: "Ajouter des articles",
    emptyCart: "Votre panier est vide",
    addFewItems: "Ajoutez quelques articles pour passer commande.",
    browseMenu: "Parcourir le menu",
    recommendedForYou: "Recommandé pour vous",
    completeYourOrder: "Complétez votre commande en un clic ✨",
    loading: "Chargement…",
    subtotal: "Sous-total",
    discount: "Réduction",
    total: "Total",
    continueCheckout: "Continuer vers la caisse",
    clearCart: "Vider le panier",
    add: "Ajouter",
    updating: "Mise à jour des totaux…",
    addedToCart: "Ajouté au panier",
  },
  es: {
    yourCart: "Su carrito",
    reviewItems: "Verifique los artículos y haga su pedido.",
    addItems: "Añadir artículos",
    emptyCart: "Su carrito está vacío",
    addFewItems: "Añada algunos artículos para hacer un pedido.",
    browseMenu: "Explorar menú",
    recommendedForYou: "Recomendado para usted",
    completeYourOrder: "Complete su pedido con un toque ✨",
    loading: "Cargando…",
    subtotal: "Subtotal",
    discount: "Descuento",
    total: "Total",
    continueCheckout: "Continuar al pago",
    clearCart: "Vaciar carrito",
    add: "Añadir",
    updating: "Actualizando totales…",
    addedToCart: "Añadido al carrito",
  },
};

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
  if (
    !translations ||
    typeof translations !== "object" ||
    Array.isArray(translations)
  ) {
    return base;
  }
  const v = (translations as Record<string, unknown>)[locale];
  return typeof v === "string" && v.trim() ? v : base;
}

export default function CartPage() {
  const params = useParams();
  const locale = (
    typeof params.locale === "string" ? params.locale : "en"
  ) as Locale;
  const router = useRouter();
  const { items, subtotal, clear, add } = useCart();
  const { currency, restaurantId, tableId, tableSlug } = useMenuRestaurant();
  const [pricing, setPricing] = useState<{
    subtotal: number;
    discount: number;
    total: number;
  } | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  const [displayNameById, setDisplayNameById] = useState<
    Record<string, string>
  >({});
  const [categoryById, setCategoryById] = useState<
    Record<string, string | undefined>
  >({});
  const [menuTypeById, setMenuTypeById] = useState<
    Record<string, "food" | "dessert" | "drink" | undefined>
  >({});
  const [upsells, setUpsells] = useState<
    {
      id: string;
      name: string;
      price: number;
      image?: string;
      outOfStock?: boolean;
    }[]
  >([]);
  const [upsellsLoading, setUpsellsLoading] = useState(false);

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
      if (res.success)
        setPricing({
          subtotal: res.subtotal,
          discount: res.discount,
          total: res.total,
        });
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

    function isMenuTypeTag(
      value: string
    ): value is "food" | "dessert" | "drink" {
      return value === "food" || value === "dessert" || value === "drink";
    }

    async function loadNames() {
      try {
        if (!restaurantId || items.length === 0) {
          setDisplayNameById({});
          setCategoryById({});
          setMenuTypeById({});
          return;
        }

        const supabase = createBrowserSupabase();
        const ids = items.map((i) => i.id);
        const { data, error } = await supabase
          .from("menu_items")
          .select("id, name, name_translations, category, tags")
          .eq("restaurant_id", restaurantId)
          .in("id", ids);

        if (error) {
          setDisplayNameById({});
          setCategoryById({});
          setMenuTypeById({});
          return;
        }

        const map: Record<string, string> = {};
        const catMap: Record<string, string | undefined> = {};
        const tagMenuTypeMap: Record<
          string,
          "food" | "dessert" | "drink" | undefined
        > = {};
        for (const row of data ?? []) {
          const baseName = String(
            (row as unknown as { name?: unknown }).name ?? ""
          );
          if (!baseName) continue;
          const id = String((row as unknown as { id?: unknown }).id);
          map[id] = pickTranslatedText({
            locale,
            base: baseName,
            translations: (row as unknown as { name_translations?: unknown })
              .name_translations,
          });
          const c = (row as unknown as { category?: unknown }).category;
          catMap[id] = c ? String(c) : undefined;

          const tagsObj =
            (row as unknown as { tags?: unknown }).tags &&
            typeof (row as unknown as { tags?: unknown }).tags === "object" &&
            !Array.isArray((row as unknown as { tags?: unknown }).tags)
              ? ((row as unknown as { tags?: unknown }).tags as Record<
                  string,
                  unknown
                >)
              : null;
          const mt =
            tagsObj && typeof tagsObj.menuType === "string"
              ? String(tagsObj.menuType)
              : "";
          tagMenuTypeMap[id] = isMenuTypeTag(mt) ? mt : undefined;
        }

        if (!cancelled) {
          setDisplayNameById(map);
          setCategoryById(catMap);
          setMenuTypeById(tagMenuTypeMap);
        }
      } catch {
        if (!cancelled) {
          setDisplayNameById({});
          setCategoryById({});
          setMenuTypeById({});
        }
      }
    }

    loadNames();
    return () => {
      cancelled = true;
    };
  }, [items, restaurantId, locale]);

  useEffect(() => {
    let cancelled = false;

    async function loadUpsells() {
      if (!restaurantId) return;
      if (items.length === 0) {
        setUpsells([]);
        setUpsellsLoading(false);
        return;
      }

      const cartIds = new Set(items.map((i) => i.id));
      const cartTypes = new Set(
        items
          .map(
            (i) => menuTypeById[i.id] ?? classifyMenuType(categoryById[i.id])
          )
          .filter(Boolean)
      );

      // If no drink in cart → recommend drinks
      // Else if no dessert → recommend desserts
      const target = !cartTypes.has("drink")
        ? "drink"
        : !cartTypes.has("dessert")
        ? "dessert"
        : null;

      if (!target) {
        setUpsells([]);
        setUpsellsLoading(false);
        return;
      }

      try {
        setUpsellsLoading(true);
        setUpsells([]);

        const supabase = createBrowserSupabase();
        const { data, error } = await supabase
          .from("menu_items")
          .select(
            "id, name, description, name_translations, description_translations, price, category, images, available, inventory_out_of_stock"
          )
          .eq("restaurant_id", restaurantId)
          .eq("available", true)
          .eq("inventory_out_of_stock", false)
          .or(supabaseCategoryOrForMenuType(target))
          .order("name", { ascending: true })
          .limit(8);

        if (error) throw error;

        const mapped =
          (data
            ?.map((row) => {
              const id = String((row as unknown as { id?: unknown }).id ?? "");
              if (!id || cartIds.has(id)) return null;

              const images = Array.isArray(
                (row as unknown as { images?: unknown }).images
              )
                ? ((row as unknown as { images?: unknown }).images as unknown[])
                : [];
              const firstImage = images[0];

              const name = pickTranslatedText({
                locale,
                base: String((row as unknown as { name?: unknown }).name ?? ""),
                translations: (
                  row as unknown as { name_translations?: unknown }
                ).name_translations,
              });

              return {
                id,
                name,
                price: Number(
                  (row as unknown as { price?: unknown }).price ?? 0
                ),
                image:
                  typeof firstImage === "string" &&
                  !firstImage.startsWith("blob:")
                    ? firstImage
                    : undefined,
                outOfStock: Boolean(
                  (row as unknown as { inventory_out_of_stock?: unknown })
                    .inventory_out_of_stock
                ),
              };
            })
            .filter(Boolean) as {
            id: string;
            name: string;
            price: number;
            image?: string;
            outOfStock?: boolean;
          }[]) ?? [];

        if (!cancelled) setUpsells(mapped.slice(0, 4));
      } catch {
        if (!cancelled) setUpsells([]);
      } finally {
        if (!cancelled) setUpsellsLoading(false);
      }
    }

    loadUpsells();
    return () => {
      cancelled = true;
    };
  }, [restaurantId, items, categoryById, menuTypeById, locale]);

  const base = `/${locale}`;

  const goToCheckout = () => {
    if (!tableSlug) return;
    router.push(`${base}/menu/${tableSlug}/checkout`);
  };

  return (
    <div className="px-4 pt-6 pb-10 bg-gradient-to-b from-[var(--menu-brand)]/10 via-background to-background">
      <div className="max-w-xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold tracking-tight">
              {translations[locale]["yourCart"] || "Your cart"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {translations[locale]["reviewItems"] ||
                "Review items, then place your order."}
            </p>
          </div>
          {tableSlug && (
            <Button asChild variant="outline" className="shrink-0">
              <Link href={`${base}/menu/${tableSlug}/browse`}>
                {translations[locale]["addItems"] || "Add items"}
              </Link>
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {items.length === 0 && (
            <Card className="p-6 text-center">
              <div className="text-base font-semibold">
                {translations[locale]["emptyCart"] || "Your cart is empty"}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {translations[locale]["addFewItems"] ||
                  "Add a few items to place an order."}
              </p>
              {tableSlug && (
                <Button
                  asChild
                  className="mt-4 bg-[var(--menu-brand)] text-white hover:bg-[var(--menu-brand)]/90"
                >
                  <Link href={`${base}/menu/${tableSlug}/browse`}>
                    {translations[locale]["browseMenu"] || "Browse menu"}
                  </Link>
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

        {/* Upsell recommendations */}
        {(upsellsLoading || upsells.length > 0) && (
          <Card className="mt-6 p-4 rounded-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">
                  {translations[locale]["recommendedForYou"] ||
                    "Recommended for you"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {translations[locale]["completeYourOrder"] ||
                    "Complete your order with one tap ✨"}
                </div>
              </div>
              {upsellsLoading && (
                <div className="text-xs text-muted-foreground">
                  {translations[locale]["loading"] || "Loading…"}
                </div>
              )}
            </div>

            <div className="mt-3 space-y-2">
              {upsells.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-muted/10 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{u.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatPrice(u.price, currency)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={Boolean(u.outOfStock)}
                    className="shrink-0 bg-[var(--menu-brand)] text-white hover:bg-[var(--menu-brand)]/90"
                    onClick={() => {
                      if (u.outOfStock) return;
                      add(
                        {
                          id: u.id,
                          name: u.name,
                          price: u.price,
                          image: u.image,
                        },
                        1
                      );
                      toast.success(
                        translations[locale]["addedToCart"] || "Added to cart"
                      );
                    }}
                  >
                    {translations[locale]["add"] || "Add"}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="mt-6 p-4 rounded-2xl">
          <div className="flex justify-between py-2">
            <div className="text-lg font-medium">
              {translations[locale]["subtotal"] || "Subtotal"}
            </div>
            <div className="font-semibold">
              {formatPrice(
                pricingLoading ? subtotal : pricing?.subtotal ?? subtotal,
                currency
              )}
            </div>
          </div>

          {(pricing?.discount ?? 0) > 0 && (
            <div className="flex justify-between py-2">
              <div className="text-sm text-muted-foreground">
                {translations[locale]["discount"] || "Discount"}
              </div>
              <div className="font-medium text-emerald-700">
                −{formatPrice(pricing?.discount ?? 0, currency)}
              </div>
            </div>
          )}

          <hr className="my-3" />

          <div className="flex justify-between items-center">
            <div>
              <div className="text-lg font-semibold">
                {translations[locale]["total"] || "Total"}
              </div>
              <div className="text-sm text-gray-500">
                {formatPrice(
                  pricingLoading ? subtotal : pricing?.total ?? subtotal,
                  currency
                )}
              </div>
              {pricingLoading && (
                <div className="text-xs text-muted-foreground mt-1">
                  {translations[locale]["updating"] || "Updating totals…"}
                </div>
              )}
            </div>

            <div className="flex flex-col items-end">
              <Button
                onClick={goToCheckout}
                disabled={items.length === 0}
                className="mt-3 w-48 bg-[var(--menu-brand)] text-white hover:bg-[var(--menu-brand)]/90"
              >
                {translations[locale]["continueCheckout"] ||
                  "Continue to checkout"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="mt-1 text-muted-foreground"
                onClick={clear}
                disabled={items.length === 0}
              >
                {translations[locale]["clearCart"] || "Clear cart"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
