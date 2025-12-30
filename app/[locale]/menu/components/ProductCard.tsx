"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "../context/CartContext";
import { formatPrice } from "@/lib/utils/currency";
import { useMenuRestaurant } from "../context/MenuRestaurantContext";
import { useState } from "react";
import MenuItemDialog from "./MenuItemDialog";

export default function ProductCard({
  product,
}: {
  product: {
    id: string;
    name: string;
    desc?: string;
    price: number;
    image?: string;
  };
}) {
  const { add } = useCart();
  const { currency } = useMenuRestaurant();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left flex gap-4 items-start p-4 bg-card rounded-2xl border shadow-sm hover:bg-muted/30 transition-colors"
      >
        <div className="w-20 h-20 rounded-xl shrink-0 bg-muted overflow-hidden border">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[var(--menu-brand)]/15 to-muted" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base sm:text-lg leading-tight truncate">
            {product.name}
          </h3>
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
              onClick={(e) => {
                e.stopPropagation();
                add(
                  {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                  },
                  1
                );
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </button>

      <MenuItemDialog product={product} open={open} onOpenChange={setOpen} />
    </>
  );
}
