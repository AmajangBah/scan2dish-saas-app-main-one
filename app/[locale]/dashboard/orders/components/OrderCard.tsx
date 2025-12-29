"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Order, OrderStatus } from "../types";

interface OrderCardProps {
  order: Order;
  onView: (order: Order) => void;
  onStatusChange: (id: string, newStatus: OrderStatus) => void;
}

export default function OrderCard({
  order,
  onView,
  onStatusChange,
}: OrderCardProps) {
  const statusColor: Record<OrderStatus, string> = {
    pending: "bg-red-200 text-red-800",
    preparing: "bg-yellow-200 text-yellow-800",
    completed: "bg-green-200 text-green-800",
  };

  const statusIcon: Record<OrderStatus, string> = {
    pending: "⏳",
    preparing: "👨‍🍳",
    completed: "✅",
  };

  const handleStatusUpdate = (newStatus: OrderStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    onStatusChange(order.id, newStatus);
  };

  return (
    <Card
      className="cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200 rounded-xl"
      onClick={() => onView(order)}
    >
      <CardContent className="flex flex-col gap-4 p-6">
        {/* Table & Status */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">{order.table}</h2>
          <span
            className={`flex items-center gap-2 capitalize px-3 py-1 rounded-full font-semibold ${
              statusColor[order.status]
            }`}
          >
            {statusIcon[order.status]} {order.status}
          </span>
        </div>

        {/* Order Info */}
        <div className="text-gray-600 text-sm space-y-1">
          <p>Order ID: {order.id}</p>
          <p>Total: ${order.total}</p>
          <p>Time: {order.time}</p>
        </div>

        {/* Status Buttons */}
        <div className="flex justify-between mt-2 gap-2 flex-wrap">
          {(["pending", "preparing", "completed"] as OrderStatus[]).map((s) => (
            <Button
              key={s}
              size="sm"
              className={`flex-1 font-semibold ${
                order.status === s
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 text-gray-800"
              } hover:scale-105`}
              onClick={(e) => handleStatusUpdate(s, e)}
            >
              {statusIcon[s]} {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
