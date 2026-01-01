"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import type { Order, OrderStatus } from "../types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Ban, CheckCircle2, CookingPot, Hourglass, Printer } from "lucide-react";
import { formatPrice } from "@/lib/utils/currency";
import { buildOrderReceiptHtml } from "./orderReceiptHtml";

export default function OrderDetailsSheet({
  open,
  onOpenChange,
  order,
  currency,
  restaurantName,
  saving = false,
  onStatusChange,
  onRequestCancel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  currency: string;
  restaurantName: string;
  saving?: boolean;
  onStatusChange: (id: string, newStatus: OrderStatus) => void;
  onRequestCancel: () => void;
}) {
  const [status, setStatus] = useState<OrderStatus | undefined>(order?.status);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setStatus(order?.status);
  }, [order]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const statusMeta: Record<
    OrderStatus,
    { label: string; badgeClass: string; icon: React.ReactNode }
  > = {
    pending: {
      label: "Pending",
      badgeClass: "bg-red-100 text-red-700 border-red-200",
      icon: <Hourglass className="h-3.5 w-3.5" />,
    },
    preparing: {
      label: "Preparing",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
      icon: <CookingPot className="h-3.5 w-3.5" />,
    },
    completed: {
      label: "Completed",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    cancelled: {
      label: "Cancelled",
      badgeClass: "bg-muted text-muted-foreground border-border",
      icon: <Ban className="h-3.5 w-3.5" />,
    },
  };

  const handlePrint = () => {
    if (!order) return;
    const win = window.open("", "", "width=420,height=650");
    if (!win) return;
    win.document.write(buildOrderReceiptHtml({ restaurantName, order, currency }));
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const handleStatusUpdate = (newStatus: OrderStatus) => {
    if (!order) return;
    if (saving) return;
    setStatus(newStatus);
    onStatusChange(order.id, newStatus);
  };

  const meta = order ? statusMeta[status ?? order.status] : null;
  const itemsTotal = order ? order.items.reduce((sum, i) => sum + i.qty * i.price, 0) : 0;
  const itemsCount = order ? order.items.reduce((sum, i) => sum + i.qty, 0) : 0;
  const orderTotal = order ? Number(order.total || 0) : 0;
  const discount = Math.max(0, itemsTotal - orderTotal);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[92vw] sm:max-w-xl lg:max-w-2xl">
        <SheetHeader className="pb-0">
          <SheetTitle className="text-xl">Order details</SheetTitle>
          <SheetDescription>
            {order ? `Table ${order.table} • ${order.time}` : "Select an order"}
          </SheetDescription>
        </SheetHeader>

        {!order ? (
          <div className="p-4 text-sm text-muted-foreground">No order selected.</div>
        ) : (
          <div className="px-4 pb-4 overflow-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Order ID</div>
                  <div className="font-mono text-xs truncate">{order.id}</div>
                </div>
                {meta && (
                  <Badge variant="outline" className={cn("gap-1.5", meta.badgeClass)}>
                    {meta.icon}
                    {meta.label}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="font-semibold">{formatPrice(orderTotal, currency)}</div>
                </div>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="text-xs text-muted-foreground">Items</div>
                  <div className="font-semibold">{itemsCount}</div>
                </div>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="text-xs text-muted-foreground">
                    {discount > 0 ? "Subtotal" : "Items total"}
                  </div>
                  <div className="font-semibold">{formatPrice(itemsTotal, currency)}</div>
                </div>
              </div>

              {discount > 0 && (
                <div className="flex items-center justify-between rounded-lg border bg-emerald-50 px-3 py-2 text-sm">
                  <span className="text-emerald-900 font-medium">Discount applied</span>
                  <span className="text-emerald-900 font-semibold">
                    −{formatPrice(discount, currency)}
                  </span>
                </div>
              )}

              <Separator />

              {(order.customerName || order.notes) && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <div className="text-xs text-muted-foreground">Customer</div>
                    <div className="font-semibold">{order.customerName?.trim() ? order.customerName : "—"}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <div className="text-xs text-muted-foreground">Notes</div>
                    <div className="text-sm whitespace-pre-wrap">{order.notes?.trim() ? order.notes : "—"}</div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-sm font-semibold">Items</div>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr className="text-xs text-muted-foreground">
                        <th className="px-3 py-2 font-medium">Item</th>
                        <th className="px-3 py-2 font-medium text-right">Qty</th>
                        <th className="px-3 py-2 font-medium text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {order.items.map((item, i) => (
                        <tr key={`${item.name}-${i}`}>
                          <td className="px-3 py-2">{item.name}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{item.qty}</td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {formatPrice(Number(item.price || 0), currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        <SheetFooter>
          <div className="flex flex-col gap-2 w-full">
            <div className="flex flex-wrap gap-2">
              {order &&
                (["pending", "preparing", "completed"] as OrderStatus[]).map((s) => {
                  const active = status === s;
                  return (
                    <Button
                      key={s}
                      size="sm"
                      variant={active ? "default" : "outline"}
                      disabled={saving || active}
                      onClick={() => handleStatusUpdate(s)}
                    >
                      {statusMeta[s].label}
                    </Button>
                  );
                })}
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                variant="outline"
                className="text-destructive"
                disabled={!order || saving || order.status === "completed" || order.status === "cancelled"}
                onClick={onRequestCancel}
              >
                Cancel order
              </Button>
              <Button disabled={!order} onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

