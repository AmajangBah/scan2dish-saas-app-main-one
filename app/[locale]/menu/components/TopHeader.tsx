"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useMenuRestaurant } from "../context/MenuRestaurantContext";

export default function TopHeader({
  title,
}: {
  title: string;
}) {
  const params = useParams();
  const tableId = typeof params.tableId === "string" ? params.tableId : null;
  const locale = typeof params.locale === "string" ? params.locale : null;
  const { items } = useCart();
  const { tableNumber } = useMenuRestaurant();
  const base = locale ? `/${locale}` : "";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto w-full max-w-2xl px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] text-muted-foreground font-medium">
            Table {tableNumber}
          </div>
          <h2 className="text-base sm:text-lg font-semibold leading-tight truncate">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <LanguageSwitcher triggerClassName="w-[44px] px-2 sm:w-[140px]" />

          <Button asChild variant="ghost" size="icon" className="relative">
            <Link
              href={tableId ? `${base}/menu/${tableId}/cart` : `${base}/menu`}
              aria-label="Open cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {items.length > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full text-[11px] font-semibold text-white bg-[var(--menu-brand)] flex items-center justify-center"
                  aria-label={`${items.reduce((s, i) => s + i.qty, 0)} items in cart`}
                >
                  {items.reduce((s, i) => s + i.qty, 0)}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
