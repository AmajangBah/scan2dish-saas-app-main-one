"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import QuantitySelector from "./QuantitySelector";
import { useCart } from "../context/CartContext";
import { useMenuRestaurant } from "../context/MenuRestaurantContext";
import { formatPrice } from "@/lib/utils/currency";
import { toast } from "sonner";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import {
  classifyMenuType,
  supabaseCategoryOrForMenuType,
} from "../utils/menuType";
import type { Locale } from "@/i18n";
import { locales } from "@/i18n";

const translations: Record<Locale, Record<string, string>> = {
  en: {
    pairsWellWith: "Pairs well with",
    findingMatches: "Finding matches…",
    oneTapAdd: "One-tap add",
    noRecommendations: "No recommendations available right now.",
    done: "Done",
    addToCart: "Add to cart",
    addedToCart: "Added to cart",
    add: "Add",
    total: "Total",
  },
  fr: {
    pairsWellWith: "Accompagnements suggérés",
    findingMatches: "Recherche en cours…",
    oneTapAdd: "Ajouter d'un clic",
    noRecommendations: "Aucune recommandation disponible.",
    done: "Terminé",
    addToCart: "Ajouter au panier",
    addedToCart: "Ajouté au panier",
    add: "Ajouter",
    total: "Total",
  },
  es: {
    pairsWellWith: "Acompañamientos sugeridos",
    findingMatches: "Buscando coincidencias…",
    oneTapAdd: "Añadir con un toque",
    noRecommendations: "No hay recomendaciones disponibles.",
    done: "Hecho",
    addToCart: "Añadir al carrito",
    addedToCart: "Añadido al carrito",
    add: "Añadir",
    total: "Total",
  },
};

export type MenuProduct = {
  id: string;
  name: string;
  desc?: string;
  price: number;
  image?: string;
  categoryLabel?: string;
  tags?: unknown;
  outOfStock?: boolean;
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

export default function MenuItemDialog({
  product,
  open,
  onOpenChange,
}: {
  product: MenuProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { add } = useCart();
  const { currency } = useMenuRestaurant();
  const [qty, setQty] = useState(1);
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);
  const [addedPulse, setAddedPulse] = useState(false);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<MenuProduct[]>([]);

  const params = useParams();
  const rawLocale = typeof params.locale === "string" ? params.locale : null;
  const locale = (
    rawLocale && (locales as readonly string[]).includes(rawLocale)
      ? rawLocale
      : "en"
  ) as Locale;
  const { restaurantId } = useMenuRestaurant();

  const lineTotal = useMemo(() => product.price * qty, [product.price, qty]);
  const imgBroken = Boolean(product.image && brokenUrl === product.image);

  useEffect(() => {
    let cancelled = false;

    async function loadRecs() {
      if (!open) return;
      if (!restaurantId) return;

      // Core pairing heuristic:
      // - Food/Dessert → recommend Drinks
      // - Drink → recommend Desserts
      const tagsObj =
        product.tags &&
        typeof product.tags === "object" &&
        !Array.isArray(product.tags)
          ? (product.tags as Record<string, unknown>)
          : null;

      const explicitMenuType =
        tagsObj && typeof tagsObj.menuType === "string"
          ? (tagsObj.menuType as "food" | "dessert" | "drink")
          : null;

      const protein =
        tagsObj && typeof tagsObj.protein === "string"
          ? tagsObj.protein.toLowerCase()
          : null;

      const type = explicitMenuType ?? classifyMenuType(product.categoryLabel);
      const target = type === "drink" ? "dessert" : "drink";

      try {
        setRecsLoading(true);
        setRecommendations([]);

        const supabase = createBrowserSupabase();
        const { data, error } = await supabase
          .from("menu_items")
          .select(
            "id, name, description, name_translations, description_translations, price, category, images, available, inventory_out_of_stock"
          )
          .eq("restaurant_id", restaurantId)
          .eq("available", true)
          .eq("inventory_out_of_stock", false)
          .neq("id", product.id)
          .or(supabaseCategoryOrForMenuType(target))
          .order("name", { ascending: true })
          .limit(20);

        if (error) throw error;

        const mapped =
          data?.map((row) => {
            const images = Array.isArray(
              (row as unknown as { images?: unknown }).images
            )
              ? ((row as unknown as { images?: unknown }).images as unknown[])
              : [];
            const firstImage = images[0];

            const name = pickTranslatedText({
              locale,
              base: String((row as unknown as { name?: unknown }).name ?? ""),
              translations: (row as unknown as { name_translations?: unknown })
                .name_translations,
            });
            const descRaw = (row as unknown as { description?: unknown })
              .description;
            const desc =
              typeof descRaw === "string" && descRaw.trim()
                ? pickTranslatedText({
                    locale,
                    base: descRaw,
                    translations: (
                      row as unknown as { description_translations?: unknown }
                    ).description_translations,
                  })
                : undefined;

            return {
              id: String((row as unknown as { id?: unknown }).id ?? ""),
              name,
              desc,
              price: Number((row as unknown as { price?: unknown }).price ?? 0),
              image:
                typeof firstImage === "string" &&
                !firstImage.startsWith("blob:")
                  ? firstImage
                  : undefined,
              categoryLabel: (() => {
                const c = (row as unknown as { category?: unknown }).category;
                return c ? String(c) : undefined;
              })(),
              outOfStock: Boolean(
                (row as unknown as { inventory_out_of_stock?: unknown })
                  .inventory_out_of_stock
              ),
            } satisfies MenuProduct;
          }) ?? [];

        // If a protein is set (e.g. chicken), boost matching drink names/categories.
        const proteinBoostKeywords =
          protein === "chicken"
            ? [
                "lemon",
                "ginger",
                "cola",
                "juice",
                "iced",
                "tea",
                "soda",
                "lime",
              ]
            : protein === "fish" || protein === "shrimp"
            ? ["lemon", "lime", "sparkling", "water", "soda"]
            : protein === "beef" || protein === "lamb" || protein === "goat"
            ? ["cola", "ginger", "malt", "sparkling", "water", "soda"]
            : [];

        const ranked = mapped
          .filter((r) => r.id)
          .map((r) => {
            const hay = `${r.name} ${r.categoryLabel ?? ""}`.toLowerCase();
            const score = proteinBoostKeywords.reduce(
              (s, kw) => (hay.includes(kw) ? s + 1 : s),
              0
            );
            return { r, score };
          })
          .sort((a, b) => b.score - a.score)
          .map((x) => x.r)
          .slice(0, 6);

        if (!cancelled) setRecommendations(ranked);
      } catch {
        if (!cancelled) setRecommendations([]);
      } finally {
        if (!cancelled) setRecsLoading(false);
      }
    }

    loadRecs();
    return () => {
      cancelled = true;
    };
  }, [
    open,
    restaurantId,
    locale,
    product.id,
    product.categoryLabel,
    product.tags,
  ]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setQty(1);
          setAddedPulse(false);
        }
      }}
    >
      <DialogContent className="p-0 overflow-hidden sm:max-w-lg">
        <div className="flex flex-col">
          <div className="aspect-[16/9] bg-muted">
            {product.image &&
            !product.image.startsWith("blob:") &&
            !imgBroken ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={() => setBrokenUrl(product.image ?? null)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[var(--menu-brand)]/15 to-muted" />
            )}
          </div>

          <div className="p-5">
            <DialogHeader>
              <DialogTitle className="text-lg leading-tight">
                {product.name}
              </DialogTitle>
            </DialogHeader>

            {product.desc && (
              <p className="mt-2 text-sm text-muted-foreground">
                {product.desc}
              </p>
            )}

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Price</div>
              <div className="font-semibold">
                {formatPrice(product.price, currency)}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Quantity</div>
              <QuantitySelector value={qty} onChange={setQty} />
            </div>

            {/* Recommendations */}
            <div className="mt-5 rounded-2xl border bg-muted/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">
                  {translations[locale]["pairsWellWith"] || "Pairs well with"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {recsLoading
                    ? translations[locale]["findingMatches"] ||
                      "Finding matches…"
                    : translations[locale]["oneTapAdd"] || "One-tap add"}
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {!recsLoading && recommendations.length === 0 && (
                  <div className="text-xs text-muted-foreground">
                    {translations[locale]["noRecommendations"] ||
                      "No recommendations available right now."}
                  </div>
                )}

                {recommendations.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-xl border bg-background/60 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {r.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatPrice(r.price, currency)}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      disabled={Boolean(r.outOfStock)}
                      onClick={() => {
                        if (r.outOfStock) return;
                        add(
                          {
                            id: r.id,
                            name: r.name,
                            price: r.price,
                            image: r.image,
                          },
                          1
                        );
                        toast.success(
                          translations[locale]["addedToCart"] || "Added to cart"
                        );
                      }}
                      className="shrink-0 bg-[var(--menu-brand)] text-white hover:bg-[var(--menu-brand)]/90"
                    >
                      {translations[locale]["add"] || "Add"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t pt-4">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">
                  {translations[locale]["total"] || "Total"}
                </div>
                <div className="font-semibold truncate">
                  {formatPrice(lineTotal, currency)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  {translations[locale]["done"] || "Done"}
                </Button>
                <Button
                  onClick={() => {
                    add(
                      {
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                      },
                      qty
                    );
                    toast.success(
                      translations[locale]["addedToCart"] || "Added to cart"
                    );
                    setAddedPulse(true);
                    // Keep the modal open so users can add more without losing context.
                    setQty(1);
                    window.setTimeout(() => setAddedPulse(false), 600);
                  }}
                  className={
                    addedPulse
                      ? "bg-[var(--menu-brand)] text-white hover:bg-[var(--menu-brand)]/90 ring-2 ring-[var(--menu-brand)]/30"
                      : "bg-[var(--menu-brand)] text-white hover:bg-[var(--menu-brand)]/90"
                  }
                >
                  Add to cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
