"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "../context/CartContext";
import { formatPrice } from "@/lib/utils/currency";
import { useMenuRestaurant } from "../context/MenuRestaurantContext";
import { useState } from "react";
import MenuItemDialog from "./MenuItemDialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function ProductCard({
  product,
}: {
  product: {
    id: string;
    name: string;
    desc?: string;
    price: number;
    image?: string;
    outOfStock?: boolean;
  };
}) {
  const { add } = useCart();
  const { currency } = useMenuRestaurant();
  const [open, setOpen] = useState(false);
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);
  const imgBroken = Boolean(product.image && brokenUrl === product.image);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (product.outOfStock) return;
          setOpen(true);
        }}
        className={`w-full text-left flex gap-4 items-start p-4 bg-card rounded-2xl border shadow-sm transition-colors active:scale-[0.99] ${
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
            {product.outOfStock && (
              <span className="shrink-0 text-[11px] font-semibold px-2 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/15">
                Out of stock
              </span>
            )}
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
              variant="outline"
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
                toast.success("Added to cart");
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>
      </button>

      <MenuItemDialog product={product} open={open} onOpenChange={setOpen} />
    </>
  );
}
