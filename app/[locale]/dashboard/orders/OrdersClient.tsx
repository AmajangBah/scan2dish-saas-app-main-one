"use client";

import { useMemo, useState } from "react";
import SearchBar from "@/components/ui/search-bar";
import Pagination from "./components/Pagination";
import OrderCard from "./components/OrderCard";
import OrderDetailsModal from "./components/OrderDetailsModal";
import { Order, OrderStatus } from "./types";
import { updateOrderStatus } from "@/app/actions/orderStatus";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function OrdersClient({
  initialOrders,
}: {
  initialOrders: Order[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 6;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.table.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter]);

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(start, start + ITEMS_PER_PAGE);

  const handleView = (order: Order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const handleStatusChange = async (id: string, newStatus: OrderStatus) => {
    setError(null);
    setSavingOrderId(id);

    const prev = orders;
    const next = prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o));
    setOrders(next);

    // Keep modal in sync if it's open
    if (selectedOrder?.id === id) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }

    const res = await updateOrderStatus({ order_id: id, status: newStatus });
    if (!res.success) {
      // rollback
      setOrders(prev);
      if (selectedOrder?.id === id) {
        const rolled = prev.find((o) => o.id === id) || null;
        setSelectedOrder(rolled);
      }
      setError(res.error || "Failed to update status");
    }

    setSavingOrderId(null);
  };

  const statusTabs: Array<{
    id: OrderStatus | "all";
    label: string;
    toneClass: string;
  }> = [
    { id: "all", label: "All", toneClass: "" },
    { id: "pending", label: "Pending", toneClass: "text-red-600" },
    { id: "preparing", label: "Preparing", toneClass: "text-amber-600" },
    { id: "completed", label: "Completed", toneClass: "text-emerald-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Orders
          </h1>
          <p className="text-sm text-muted-foreground">
            Update statuses quickly and keep your kitchen in sync.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "order" : "orders"}
        </div>
      </div>

      {/* Controls */}
      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:max-w-sm">
              <SearchBar
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setCurrentPage(1);
                }}
                placeholder="Search by table or order ID…"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {statusTabs.map((tab) => (
                <Button
                  key={tab.id}
                  type="button"
                  variant={statusFilter === tab.id ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "rounded-full",
                    statusFilter !== tab.id && tab.toneClass
                  )}
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setCurrentPage(1);
                  }}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          {(error || savingOrderId) && (
            <div className="flex flex-col gap-1">
              {error && (
                <div className="text-sm text-red-600">{error}</div>
              )}
              {savingOrderId && (
                <div className="text-xs text-muted-foreground">
                  Saving status…
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content */}
      {paginated.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {paginated.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              saving={savingOrderId === order.id}
              onView={handleView}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12">
            <div className="mx-auto max-w-md text-center space-y-2">
              <div className="text-base font-semibold">
                {search.trim() || statusFilter !== "all"
                  ? "No matching orders"
                  : "No orders yet"}
              </div>
              <p className="text-sm text-muted-foreground">
                {search.trim() || statusFilter !== "all"
                  ? "Try clearing filters or searching a different table."
                  : "When customers start scanning table QR codes, new orders will appear here."}
              </p>
              {(search.trim() || statusFilter !== "all") && (
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("all");
                      setCurrentPage(1);
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Pagination
        currentPage={currentPage}
        totalItems={filtered.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />

      <OrderDetailsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        order={selectedOrder}
        saving={selectedOrder ? savingOrderId === selectedOrder.id : false}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}


