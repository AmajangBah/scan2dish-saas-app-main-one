"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import QuantitySelector from "./QuantitySelector";
import { useCart } from "../context/CartContext";
import { useMenuRestaurant } from "../context/MenuRestaurantContext";
import { formatPrice } from "@/lib/utils/currency";

export type MenuProduct = {
  id: string;
  name: string;
  desc?: string;
  price: number;
  image?: string;
};

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

  const lineTotal = useMemo(() => product.price * qty, [product.price, qty]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setQty(1);
      }}
    >
      <DialogContent className="p-0 overflow-hidden sm:max-w-lg">
        <div className="grid gap-0">
          <div className="aspect-[16/9] bg-muted">
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[var(--menu-brand)]/15 to-muted" />
            )}
          </div>

          <div className="p-5">
            <DialogHeader>
              <DialogTitle className="text-lg">{product.name}</DialogTitle>
            </DialogHeader>

            {product.desc && (
              <p className="mt-2 text-sm text-muted-foreground">{product.desc}</p>
            )}

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Price</div>
              <div className="font-semibold">{formatPrice(product.price, currency)}</div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Quantity</div>
              <QuantitySelector value={qty} onChange={setQty} />
            </div>

            <div className="mt-5 flex items-center justify-between border-t pt-4">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="font-semibold truncate">
                  {formatPrice(lineTotal, currency)}
                </div>
              </div>

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
                  onOpenChange(false);
                }}
                className="bg-[var(--menu-brand)] text-white hover:bg-[var(--menu-brand)]/90"
              >
                Add to cart
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

