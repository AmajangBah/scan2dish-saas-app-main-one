import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, UtensilsCrossed, ShoppingBag, Info } from "lucide-react";

export default function MenuIntroPage({
  params,
}: {
  params: { locale: string; tableId: string };
}) {
  const { locale, tableId } = params;

  return (
    <div className="px-4 pt-6 pb-10">
      <div className="max-w-xl mx-auto space-y-4">
        <Card className="p-6 rounded-2xl border shadow-sm">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-(--menu-brand)/10 grid place-items-center border border-(--menu-brand)/15">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm text-muted-foreground">Welcome</div>
              <h1 className="text-2xl font-semibold tracking-tight">
                You’re about to order from this table
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Review the details below, then continue to the menu.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="text-xs text-muted-foreground">Table</div>
              <div className="text-base font-semibold">Table {tableId}</div>
              <div className="text-xs text-muted-foreground mt-1">
                If this doesn't match your table, please ask staff for the
                correct QR.
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShoppingBag className="h-4 w-4 `text-(--menu-brand)" />
                  Browse and add items
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Explore categories, tap “Add”, and review your cart anytime.
                </p>
              </div>
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Info className="h-4 w-4 text-(--menu-brand)" />
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
              <Link href={`/${locale}/menu/${tableId}/browse`}>
                Browse menu
              </Link>
            </Button>
            <Button
              asChild
              className="rounded-xl bg-(--menu-brand) text-white hover:bg-(--menu-brand)/90"
            >
              <Link href={`/${locale}/menu/${tableId}/browse`}>
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
