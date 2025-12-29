"use client";

import { useMemo, useState } from "react";
import SearchBar from "@/components/ui/search-bar";
import Pagination from "./components/Pagination";
import OrderCard from "./components/OrderCard";
import OrderDetailsModal from "./components/OrderDetailsModal";
import { Order, OrderStatus } from "./types";
import { updateOrderStatus } from "@/app/actions/orderStatus";

export default function OrdersClient({
  initialOrders,
}: {
  initialOrders: Order[];
}) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 6;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => o.table.toLowerCase().includes(q));
  }, [orders, search]);

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

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 text-center">Orders</h1>

      <div className="max-w-md mx-auto space-y-2">
        <SearchBar 
          value={search} 
          onChange={setSearch} 
          placeholder="Search by table..."
        />
        {error && <div className="text-sm text-red-600 text-center">{error}</div>}
        {savingOrderId && (
          <div className="text-xs text-gray-500 text-center">
            Saving status…
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {paginated.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onView={handleView}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>

      {paginated.length === 0 && (
        <p className="text-center text-gray-400 mt-12">No orders found.</p>
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
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}


