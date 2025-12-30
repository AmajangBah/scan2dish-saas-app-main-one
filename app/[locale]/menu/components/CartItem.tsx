"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "../context/CartContext";
import QuantitySelector from "./QuantitySelector";
import { formatPrice } from "@/lib/utils/currency";
import { useMenuRestaurant } from "../context/MenuRestaurantContext";

export default function CartItem({
  item,
}: {
  item: { id: string; name: string; price: number; qty: number };
}) {
  const { updateQty, remove } = useCart();
  const { currency } = useMenuRestaurant();

  return (
    <div className="p-4 bg-card rounded-2xl border shadow-sm flex items-center gap-4">
      <div className="w-16 h-16 rounded-xl bg-muted border" />
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium">{item.name}</h4>
            <p className="text-sm text-muted-foreground">
              {formatPrice(item.price, currency)}
            </p>
          </div>

          <div className="text-right">
            <Button
              variant="ghost"
              className="text-sm text-destructive hover:text-destructive"
              onClick={() => remove(item.id)}
            >
              Remove
            </Button>
          </div>
        </div>

        <div className="mt-3">
          <QuantitySelector
            value={item.qty}
            onChange={(v) => updateQty(item.id, v)}
          />
        </div>
      </div>
    </div>
  );
}
