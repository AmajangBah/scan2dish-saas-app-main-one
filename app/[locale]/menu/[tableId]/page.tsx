"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  UtensilsCrossed,
  ShoppingBag,
  Info,
  Sparkles,
  Clock,
} from "lucide-react";
import { useMenuRestaurant } from "../context/MenuRestaurantContext";

export default function MenuIntroPage() {
  const params = useParams();
  const locale = typeof params.locale === "string" ? params.locale : null;
  const tableId = typeof params.tableId === "string" ? params.tableId : null;
  const base = locale ? `/${locale}` : "";
  const { restaurantName, tableNumber, tableSlug } = useMenuRestaurant();
  const browseHref = tableSlug ? `${base}/menu/${tableSlug}/browse` : `${base}/menu`;

  return (
    <div className="px-4 pt-6 pb-10 bg-gradient-to-b from-[var(--menu-brand)]/15 via-background to-background">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="rounded-3xl border bg-card/80 backdrop-blur shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-2xl bg-[var(--menu-brand)]/10 grid place-items-center border border-[var(--menu-brand)]/15">
                <UtensilsCrossed className="h-5 w-5 text-[var(--menu-brand)]" />
              </div>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground rounded-full border bg-muted/30 px-3 py-1">
                  🍽️ Table {tableNumber ?? tableId ?? ""}
                </div>
                <h1 className="text-2xl font-semibold tracking-tight mt-3">
                  Welcome to {restaurantName} 👋
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Tap, filter, and order in seconds — no waiting.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <Card className="rounded-2xl border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">Quick tip</div>
                    <div className="text-sm font-semibold">
                      Use filters like Food 🍽️, Desserts 🍰, Drinks 🥤
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      If this doesn&apos;t match your table, please ask staff for the correct QR.
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-2xl bg-white/60 border grid place-items-center shrink-0">
                    <Sparkles className="h-5 w-5 text-[var(--menu-brand)]" />
                  </div>
                </div>
              </Card>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <ShoppingBag className="h-4 w-4 text-[var(--menu-brand)]" />
                    Add items
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Browse categories and tap “Add”.
                  </p>
                </div>
                <div className="rounded-2xl border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Info className="h-4 w-4 text-[var(--menu-brand)]" />
                    Review cart
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Check quantities anytime.
                  </p>
                </div>
                <div className="rounded-2xl border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Clock className="h-4 w-4 text-[var(--menu-brand)]" />
                    Send to kitchen
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Place your order when ready.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button asChild variant="outline" className="rounded-2xl">
                <Link href={browseHref}>Browse menu</Link>
              </Button>
              <Button
                asChild
                className="rounded-2xl bg-[var(--menu-brand)] text-white hover:bg-[var(--menu-brand)]/90"
              >
                <Link href={browseHref}>
                  Let&apos;s eat <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
