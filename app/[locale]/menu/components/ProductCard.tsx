"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "../context/CartContext";
import { formatPrice } from "@/lib/utils/currency";
import { useMenuRestaurant } from "../context/MenuRestaurantContext";
import { useState } from "react";
import MenuItemDialog from "./MenuItemDialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import type { Locale } from "@/i18n";

const translations: Record<Locale, Record<string, string>> = {
  en: {
    outOfStock: "Out of stock",
    add: "Add",
    addedToCart: "Added to cart",
  },
  fr: {
    outOfStock: "Rupture de stock",
    add: "Ajouter",
    addedToCart: "Ajouté au panier",
  },
  es: {
    outOfStock: "Agotado",
    add: "Añadir",
    addedToCart: "Añadido al carrito",
  },
};

export default function ProductCard({
  product,
}: {
  product: {
    id: string;
    name: string;
    desc?: string;
    price: number;
    image?: string;
    categoryLabel?: string;
    tags?: unknown;
    outOfStock?: boolean;
    discountBadge?: string;
  };
}) {
  const params = useParams();
  const locale = (
    typeof params.locale === "string" ? params.locale : "en"
  ) as Locale;
  const { add } = useCart();
  const { currency } = useMenuRestaurant();
  const [open, setOpen] = useState(false);
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);
  const imgBroken = Boolean(product.image && brokenUrl === product.image);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            if (product.outOfStock) return;
            setOpen(true);
          }
        }}
        onClick={() => {
          if (product.outOfStock) return;
          setOpen(true);
        }}
        className={`w-full text-left flex gap-4 items-start p-4 bg-card/90 backdrop-blur rounded-2xl border shadow-sm transition-colors active:scale-[0.99] cursor-pointer ${
          product.outOfStock
            ? "opacity-70 cursor-not-allowed"
            : "hover:bg-muted/30"
        }`}
      >
        <div className="w-20 h-20 rounded-xl shrink-0 bg-muted overflow-hidden border">
          {product.image && !product.image.startsWith("blob:") && !imgBroken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setBrokenUrl(product.image ?? null)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[var(--menu-brand)]/15 to-muted" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-base sm:text-lg leading-tight truncate">
              {product.name}
            </h3>
            <div className="flex items-center gap-2 shrink-0">
              {product.discountBadge && (
                <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {product.discountBadge}
                </span>
              )}
              {product.outOfStock && (
                <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/15">
                  {translations[locale]["outOfStock"] || "Out of stock"}
                </span>
              )}
            </div>
          </div>
          {product.desc && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {product.desc}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-base font-semibold">
              {formatPrice(product.price, currency)}
            </div>
            <Button
              type="button"
              variant="default"
              disabled={Boolean(product.outOfStock)}
              onClick={(e) => {
                e.stopPropagation();
                if (product.outOfStock) return;
                add(
                  {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                  },
                  1
                );
                toast.success(
                  translations[locale]["addedToCart"] || "Added to cart"
                );
              }}
              className="bg-[var(--menu-brand)] text-white hover:bg-[var(--menu-brand)]/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              {translations[locale]["add"] || "Add"}
            </Button>
          </div>
        </div>
      </div>

      <MenuItemDialog product={product} open={open} onOpenChange={setOpen} />
    </>
  );
}
