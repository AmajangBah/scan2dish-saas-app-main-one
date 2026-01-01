"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils/currency";
import { ArrowRight, Ban, CheckCircle2, CookingPot, Hourglass } from "lucide-react";
import type { Order, OrderStatus } from "../types";

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

export default function OrdersTable({
  orders,
  currency,
  savingOrderId,
  newOrderSince,
  onView,
  onStatusChange,
}: {
  orders: Order[];
  currency: string;
  savingOrderId: string | null;
  newOrderSince: Record<string, number>;
  onView: (order: Order) => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
}) {
  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-4">Table</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Time</TableHead>
            <TableHead className="text-right">Items</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right px-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => {
            const itemsCount = o.items.reduce((sum, i) => sum + (i.qty || 0), 0);
            const meta = statusMeta[o.status];
            const isNew = Boolean(newOrderSince[o.id]) && o.status === "pending";
            const saving = savingOrderId === o.id;

            return (
              <TableRow
                key={o.id}
                className={cn(
                  "cursor-pointer",
                  isNew && "bg-orange-50/60",
                  saving && "opacity-80"
                )}
                onClick={() => onView(o)}
              >
                <TableCell className="px-4">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">Table {o.table}</div>
                    {isNew && (
                      <span
                        className="inline-flex h-2 w-2 rounded-full bg-orange-500 animate-pulse"
                        aria-label="New order"
                      />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono truncate max-w-[240px]">
                    {o.id}
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className={cn("gap-1.5", meta.badgeClass)}>
                    {meta.icon}
                    {meta.label}
                  </Badge>
                </TableCell>

                <TableCell className="text-sm text-muted-foreground">{o.time}</TableCell>

                <TableCell className="text-right tabular-nums">{itemsCount}</TableCell>

                <TableCell className="text-right tabular-nums font-semibold">
                  {formatPrice(Number(o.total || 0), currency)}
                </TableCell>

                <TableCell className="text-right px-4" onClick={(e) => e.stopPropagation()}>
                  <div className="inline-flex items-center gap-2">
                    {o.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={saving}
                        onClick={() => onStatusChange(o.id, "preparing")}
                      >
                        Start
                      </Button>
                    )}
                    {o.status === "preparing" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={saving}
                        onClick={() => onStatusChange(o.id, "completed")}
                      >
                        Ready
                      </Button>
                    )}
                    <Button size="sm" variant="secondary" disabled={saving} onClick={() => onView(o)}>
                      Open <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

