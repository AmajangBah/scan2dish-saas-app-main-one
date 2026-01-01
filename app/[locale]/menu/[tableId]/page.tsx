 "use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, UtensilsCrossed, ShoppingBag, Info } from "lucide-react";
import { useMenuRestaurant } from "../context/MenuRestaurantContext";

export default function MenuIntroPage() {
  const params = useParams();
  const tableId = typeof params.tableId === "string" ? params.tableId : null;
  const locale = typeof params.locale === "string" ? params.locale : null;
  const base = locale ? `/${locale}` : "";
  const { restaurantName, tableNumber } = useMenuRestaurant();

  return (
    <div className="px-4 pt-6 pb-10">
      <div className="max-w-xl mx-auto space-y-4">
        <Card className="p-6 rounded-2xl border shadow-sm">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-[var(--menu-brand)]/10 text-[var(--menu-brand)] grid place-items-center border border-[var(--menu-brand)]/15">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm text-muted-foreground">Welcome</div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {restaurantName}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Table {tableNumber} • Browse the menu and send your order to the kitchen.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShoppingBag className="h-4 w-4 text-[var(--menu-brand)]" />
                  Browse and add items
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Explore categories, tap “Add”, and review your cart anytime.
                </p>
              </div>
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Info className="h-4 w-4 text-[var(--menu-brand)]" />
                  Send order to kitchen
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  When you’re ready, confirm your cart and place your order.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href={tableId ? `${base}/menu/${tableId}/browse` : `${base}/menu`}>
                Browse menu
              </Link>
            </Button>
            <Button asChild className="rounded-xl bg-[var(--menu-brand)] text-white hover:bg-[var(--menu-brand)]/90">
              <Link href={tableId ? `${base}/menu/${tableId}/browse` : `${base}/menu`}>
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

