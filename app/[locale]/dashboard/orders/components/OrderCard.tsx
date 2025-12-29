"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Order, OrderStatus } from "../types";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle2, CookingPot, Hourglass } from "lucide-react";

interface OrderCardProps {
  order: Order;
  saving?: boolean;
  isNew?: boolean;
  onView: (order: Order) => void;
  onStatusChange: (id: string, newStatus: OrderStatus) => void;
}

export default function OrderCard({
  order,
  saving = false,
  isNew = false,
  onView,
  onStatusChange,
}: OrderCardProps) {
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
  };

  const handleStatusUpdate = (newStatus: OrderStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    if (saving) return;
    onStatusChange(order.id, newStatus);
  };

  const itemsCount = order.items.reduce((sum, i) => sum + (i.qty || 0), 0);
  const meta = statusMeta[order.status];

  return (
    <Card
      className={cn(
        "cursor-pointer rounded-xl border shadow-sm hover:shadow-md transition-all",
        saving && "opacity-80",
        isNew && "ring-2 ring-orange-500/30 shadow-md"
      )}
      onClick={() => onView(order)}
    >
      <CardContent className="flex flex-col gap-4 p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Table</div>
            <div className="text-xl font-semibold tracking-tight truncate">
              {order.table}
            </div>
            {isNew && (
              <div className="mt-1 flex items-center gap-2 text-xs text-orange-700">
                <span className="inline-flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                New order
              </div>
            )}
          </div>
          <Badge
            variant="outline"
            className={cn("gap-1.5 capitalize", meta.badgeClass)}
          >
            {meta.icon}
            {meta.label}
          </Badge>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="font-semibold">${order.total}</div>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="text-xs text-muted-foreground">Items</div>
            <div className="font-semibold">{itemsCount}</div>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="text-xs text-muted-foreground">Time</div>
            <div className="font-semibold">{order.time}</div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground truncate">
          Order ID: {order.id}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          {(["pending", "preparing", "completed"] as OrderStatus[]).map((s) => {
            const isActive = order.status === s;
            return (
              <Button
                key={s}
                size="sm"
                variant={isActive ? "default" : "outline"}
                disabled={saving || isActive}
                className="capitalize"
                onClick={(e) => handleStatusUpdate(s, e)}
              >
                {statusMeta[s].label}
              </Button>
            );
          })}

          <Button
            size="sm"
            variant="secondary"
            className="ml-auto gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onView(order);
            }}
          >
            View
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
