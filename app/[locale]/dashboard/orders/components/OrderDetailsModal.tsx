"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useRef, useState, useEffect } from "react";
import { Order, OrderStatus } from "../types";

interface OrderDetailsModalProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
  onStatusChange: (id: string, newStatus: OrderStatus) => void;
}

export default function OrderDetailsModal({
  open,
  onClose,
  order,
  onStatusChange,
}: OrderDetailsModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<OrderStatus | undefined>(order?.status);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setStatus(order?.status);
  }, [order]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const win = window.open("", "", "width=600,height=600");
    if (!win) return;
    win.document.write(`
      <html>
        <head><title>Print Order</title></head>
        <body>${printContents}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const handleStatusUpdate = (newStatus: OrderStatus) => {
    if (!order) return;
    setStatus(newStatus);
    onStatusChange(order.id, newStatus);
  };

  if (!order) return null;

  const statusColor: Record<OrderStatus, string> = {
    pending: "bg-red-100 text-red-700",
    preparing: "bg-yellow-100 text-yellow-700",
    completed: "bg-green-100 text-green-700",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-xl bg-white shadow-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Order Details
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="space-y-4 text-gray-700">
          <p>
            <strong>Order ID:</strong> {order.id}
          </p>
          <p>
            <strong>Table:</strong> {order.table}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span
              className={`ml-2 px-2 py-1 rounded-full text-sm font-semibold ${
                statusColor[status!]
              }`}
            >
              {status}
            </span>
          </p>
          <p>
            <strong>Total:</strong> ${order.total}
          </p>
          <p>
            <strong>Time:</strong> {order.time}
          </p>

          <Separator />

          <div>
            <p className="font-semibold text-gray-800 mb-2">Items:</p>
            <ul className="list-disc pl-6 space-y-1">
              {order.items.map((item, i) => (
                <li key={i} className="text-gray-600">
                  {item.name} — {item.qty} × ${item.price}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 flex-wrap gap-2">
          <div className="flex gap-2">
            {(["pending", "preparing", "completed"] as OrderStatus[]).map(
              (s) => (
                <Button
                  key={s}
                  disabled={status === s}
                  onClick={() => handleStatusUpdate(s)}
                  className={`capitalize ${statusColor[s]} hover:opacity-80`}
                >
                  {s}
                </Button>
              )
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handlePrint}>Print</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
