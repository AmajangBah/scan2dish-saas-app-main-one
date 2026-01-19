"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils/currency";
import { useCart } from "../context/CartContext";
import { useMenuRestaurant } from "../context/MenuRestaurantContext";
import type { Locale } from "@/i18n";

const translations: Record<Locale, Record<string, string>> = {
  en: {
    "customer.yourOrder": "Your Order",
    "customer.cart": "View Cart",
  },
  fr: {
    "customer.yourOrder": "Votre commande",
    "customer.cart": "Voir le panier",
  },
  es: {
    "customer.yourOrder": "Tu pedido",
    "customer.cart": "Ver carrito",
  },
};

export default function CartBar() {
  const params = useParams();
  const locale = (
    typeof params.locale === "string" ? params.locale : "en"
  ) as Locale;
  const { items, subtotal } = useCart();

  let currency = "GMD";
  let tableSlug = null;
  let tableId = null;

  try {
    const restaurantContext = useMenuRestaurant();
    currency = restaurantContext.currency;
    tableSlug = restaurantContext.tableSlug;
    tableId = restaurantContext.tableId;
  } catch (err) {
    // Not wrapped in MenuRestaurantProvider - render nothing
    return null;
  }

  const itemCount = items.reduce((s, it) => s + it.qty, 0);
  const base = `/${locale}`;
  const cartPath = tableSlug
    ? `${base}/menu/${tableSlug}/cart`
    : tableId
      ? `${base}/menu/${tableId}/cart`
      : null;
  if (!cartPath || itemCount <= 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 pb-safe">
      <div className="mx-auto w-full max-w-2xl px-4 pb-4">
        <div className="rounded-2xl border bg-card/95 backdrop-blur shadow-lg">
          <div className="p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">
                {translations[locale]["customer.yourOrder"] || "Your Order"}
              </div>
              <div className="font-semibold truncate">
                {itemCount} {itemCount === 1 ? "item" : "items"} •{" "}
                {formatPrice(subtotal, currency)}
              </div>
            </div>

            <Button
              asChild
              className="shrink-0 bg-[var(--menu-brand)] text-white hover:bg-[var(--menu-brand)]/90"
            >
              <Link href={cartPath}>
                {translations[locale]["customer.cart"] || "View Cart"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
