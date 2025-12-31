"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SearchBar from "@/components/ui/search-bar";
import Pagination from "./components/Pagination";
import OrderCard from "./components/OrderCard";
import OrderDetailsModal from "./components/OrderDetailsModal";
import OrderDetailsSheet from "./components/OrderDetailsSheet";
import OrdersTable from "./components/OrdersTable";
import { Order, OrderStatus } from "./types";
import { updateOrderStatus } from "@/app/actions/orderStatus";
import { cancelOrder } from "@/app/actions/orderCancel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { LayoutGrid, Table as TableIcon } from "lucide-react";

type OrderItemRow = { name?: string; quantity?: number; price?: string | number };
type RestaurantTableJoin =
  | { table_number?: string }
  | { table_number?: string }[]
  | null
  | undefined;
type OrderRow = {
  id: string;
  status: OrderStatus;
  total: number | string | null;
  items: unknown;
  customer_name?: string | null;
  notes?: string | null;
  created_at: string;
  restaurant_tables: RestaurantTableJoin;
};

export default function OrdersClient({
  restaurantId,
  currency,
  initialOrders,
}: {
  restaurantId: string;
  currency: string;
  initialOrders: Order[];
}) {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<
    "connecting" | "live" | "reconnecting" | "offline"
  >("connecting");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // "New order" highlighting (visual even if sound is muted)
  const [newOrderSince, setNewOrderSince] = useState<Record<string, number>>({});

  // Sound settings (autoplay-safe: user must enable)
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const audioRef = useRef<{ ctx: AudioContext; gain: GainNode } | null>(null);
  const notifiedIdsRef = useRef<Set<string>>(new Set());
  const supabaseRef = useRef<ReturnType<typeof createBrowserSupabase> | null>(
    null
  );
  const ordersRef = useRef<Order[]>(initialOrders);
  const liveStatusRef = useRef(liveStatus);

  const ITEMS_PER_PAGE = viewMode === "table" ? 12 : 6;

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

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    liveStatusRef.current = liveStatus;
  }, [liveStatus]);

  const handleView = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
    // Mark as "seen" (stop highlight) when opened
    setNewOrderSince((prev) => {
      if (!prev[order.id]) return prev;
      const next = { ...prev };
      delete next[order.id];
      return next;
    });
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

    const res =
      newStatus === "cancelled"
        ? await cancelOrder({ order_id: id })
        : await updateOrderStatus({ order_id: id, status: newStatus });
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

  function getStorageKey(key: string) {
    return `s2d_${key}_${restaurantId}`;
  }

  async function ensureAudioReady() {
    try {
      if (!audioRef.current) {
        const w = window as Window & { webkitAudioContext?: typeof AudioContext };
        const AudioCtx = window.AudioContext ?? w.webkitAudioContext;
        if (!AudioCtx) return false;
        const ctx = new AudioCtx();
        const gain = ctx.createGain();
        gain.gain.value = volume;
        gain.connect(ctx.destination);
        audioRef.current = { ctx, gain };
      }
      if (audioRef.current.ctx.state !== "running") {
        await audioRef.current.ctx.resume();
      }
      audioRef.current.gain.gain.value = volume;
      return true;
    } catch {
      return false;
    }
  }

  function playNewOrderSound() {
    if (!soundEnabled) return;
    const audio = audioRef.current;
    if (!audio || audio.ctx.state !== "running") return;

    // A short, clear two-tone chime (non-annoying)
    const now = audio.ctx.currentTime;
    const g = audio.gain;

    const o1 = audio.ctx.createOscillator();
    o1.type = "sine";
    o1.frequency.value = 880;
    o1.connect(g);
    o1.start(now);
    o1.stop(now + 0.08);

    const o2 = audio.ctx.createOscillator();
    o2.type = "sine";
    o2.frequency.value = 660;
    o2.connect(g);
    o2.start(now + 0.1);
    o2.stop(now + 0.22);
  }

  function markOrderAsNew(orderId: string) {
    setNewOrderSince((prev) => {
      if (prev[orderId]) return prev;
      return { ...prev, [orderId]: Date.now() };
    });
  }

  function maybeNotifyNewOrder(orderId: string) {
    if (notifiedIdsRef.current.has(orderId)) return;
    notifiedIdsRef.current.add(orderId);
    // Persist a small rolling window so refreshes don't re-trigger
    try {
      const key = getStorageKey("notified_order_ids");
      const existing = JSON.parse(window.localStorage.getItem(key) || "[]") as string[];
      const next = [orderId, ...existing.filter((x) => x !== orderId)].slice(0, 150);
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // ignore
    }

    markOrderAsNew(orderId);
    playNewOrderSound();
  }

  function upsertOrder(nextOrder: Order) {
    setOrders((prev) => {
      const existingIdx = prev.findIndex((o) => o.id === nextOrder.id);
      if (existingIdx === -1) {
        return [nextOrder, ...prev];
      }
      const copy = [...prev];
      copy[existingIdx] = { ...copy[existingIdx], ...nextOrder };
      return copy;
    });
    if (selectedOrder?.id === nextOrder.id) {
      setSelectedOrder({ ...selectedOrder, ...nextOrder });
    }
  }

  function mapItems(items: unknown) {
    const arr = Array.isArray(items) ? (items as OrderItemRow[]) : [];
    return arr.map((item) => ({
      name: item.name || "Unknown Item",
      qty: item.quantity || 1,
      price: parseFloat(String(item.price || 0)),
    }));
  }

  function formatOrderRow(row: OrderRow): Order {
    const rt = row.restaurant_tables;
    const tableNumber = Array.isArray(rt) ? rt[0]?.table_number : rt?.table_number;
    const createdAt = String(row.created_at);
    const time = new Date(createdAt).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      id: String(row.id),
      table: tableNumber || "Unknown",
      status: row.status,
      total: parseFloat(String(row.total || 0)).toFixed(2),
      time,
      createdAt,
      items: mapItems(row.items),
      customerName: row.customer_name ?? null,
      notes: row.notes ?? null,
    };
  }

  async function fetchOrderWithTable(orderId: string) {
    const supabase = supabaseRef.current ?? createBrowserSupabase();
    supabaseRef.current = supabase;

    const { data, error: fetchError } = await supabase
      .from("orders")
      .select(
        `
        id,
        status,
        total,
        items,
        customer_name,
        notes,
        created_at,
        restaurant_tables(table_number)
      `
      )
      .eq("id", orderId)
      .single();

    if (fetchError || !data) return null;

    return formatOrderRow(data as unknown as OrderRow);
  }

  async function refreshOrdersOnce() {
    const supabase = supabaseRef.current ?? createBrowserSupabase();
    supabaseRef.current = supabase;
    const { data } = await supabase
      .from("orders")
      .select(
        `
        id,
        status,
        total,
        items,
        customer_name,
        notes,
        created_at,
        restaurant_tables(table_number)
      `
      )
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(50);

    const rows = (data ?? []) as unknown as OrderRow[];
    const mapped: Order[] = rows.map(formatOrderRow);

    setOrders((prev) => {
      const existingIds = new Set(prev.map((o) => o.id));
      for (const o of mapped) {
        if (!existingIds.has(o.id)) {
          maybeNotifyNewOrder(o.id);
        }
      }
      return mapped;
    });
  }

  // Load persisted settings on mount
  useEffect(() => {
    try {
      const enabled = window.localStorage.getItem(getStorageKey("sound_enabled"));
      const storedVol = window.localStorage.getItem(getStorageKey("sound_volume"));
      setSoundEnabled(enabled === "true");
      if (storedVol) {
        const n = Number(storedVol);
        if (!Number.isNaN(n)) setVolume(Math.min(1, Math.max(0, n)));
      }
      const storedNotified = JSON.parse(
        window.localStorage.getItem(getStorageKey("notified_order_ids")) || "[]"
      ) as string[];
      notifiedIdsRef.current = new Set(storedNotified);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  // Keep audio gain in sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.gain.gain.value = volume;
    }
    try {
      window.localStorage.setItem(getStorageKey("sound_volume"), String(volume));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume, restaurantId]);

  // Live subscription + polling fallback
  useEffect(() => {
    const supabase = createBrowserSupabase();
    supabaseRef.current = supabase;

    setLiveStatus("connecting");

    type ChangePayload = { new: Partial<OrderRow> & { id?: string } };

    const channel = supabase
      .channel(`restaurant-orders-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async (payload) => {
          const p = payload as unknown as ChangePayload;
          const id = String(p.new?.id ?? "");
          if (!id) return;

          const full = await fetchOrderWithTable(id);
          if (!full) return;

          upsertOrder(full);
          maybeNotifyNewOrder(full.id);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async (payload) => {
          const p = payload as unknown as ChangePayload;
          const id = String(p.new?.id ?? "");
          if (!id) return;

          // Try to update using payload; fall back to fetch if we don't have it yet.
          const existing = ordersRef.current.find((o) => o.id === id);
          if (!existing) {
            const full = await fetchOrderWithTable(id);
            if (full) upsertOrder(full);
            return;
          }

          const newStatus = p.new.status as OrderStatus | undefined;
          const newTotalRaw = p.new.total;
          const newTotal =
            newTotalRaw != null ? Number(newTotalRaw).toFixed(2) : undefined;
          const createdAt = p.new.created_at ? String(p.new.created_at) : existing.createdAt;
          const time = new Date(createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

          upsertOrder({
            ...existing,
            status: newStatus ?? existing.status,
            total: newTotal ?? existing.total,
            createdAt,
            time,
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setLiveStatus("live");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setLiveStatus("reconnecting");
        else if (status === "CLOSED") setLiveStatus("offline");
      });

    // Polling fallback (every 10s) when not live
    const interval = window.setInterval(() => {
      if (liveStatusRef.current === "live") return;
      refreshOrdersOnce().catch(() => {
        // ignore
      });
    }, 10_000);

    // Initial refresh (covers missed events during reconnect / tab sleep)
    refreshOrdersOnce().catch(() => {
      // ignore
    });

    return () => {
      window.clearInterval(interval);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  // Expire "new" highlights after 2 minutes
  useEffect(() => {
    const t = window.setInterval(() => {
      const cutoff = Date.now() - 2 * 60_000;
      setNewOrderSince((prev) => {
        const ids = Object.entries(prev);
        const next: Record<string, number> = {};
        for (const [id, ts] of ids) {
          if (ts >= cutoff) next[id] = ts;
        }
        return next;
      });
    }, 15_000);
    return () => window.clearInterval(t);
  }, []);

  const statusTabs: Array<{
    id: OrderStatus | "all";
    label: string;
    toneClass: string;
  }> = [
    { id: "all", label: "All", toneClass: "" },
    { id: "pending", label: "Pending", toneClass: "text-red-600" },
    { id: "preparing", label: "Preparing", toneClass: "text-amber-600" },
    { id: "completed", label: "Completed", toneClass: "text-emerald-600" },
    { id: "cancelled", label: "Cancelled", toneClass: "text-muted-foreground" },
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  liveStatus === "live"
                    ? "bg-emerald-500"
                    : liveStatus === "connecting"
                    ? "bg-amber-500 animate-pulse"
                    : liveStatus === "reconnecting"
                    ? "bg-amber-500 animate-pulse"
                    : "bg-gray-400"
                )}
              />
              <Badge variant="outline" className="text-xs">
                {liveStatus === "live"
                  ? "Live"
                  : liveStatus === "connecting"
                  ? "Connecting…"
                  : liveStatus === "reconnecting"
                  ? "Reconnecting…"
                  : "Offline"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {liveStatus === "live"
                  ? "Updates are instant."
                  : "Fallback polling is active."}
              </span>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Sound</span>
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={async (checked) => {
                    if (checked) {
                      const ok = await ensureAudioReady();
                      if (!ok) {
                        toast.error("Sound blocked by browser. Tap again after interacting.");
                        setSoundEnabled(false);
                        return;
                      }
                    }
                    setSoundEnabled(checked);
                    try {
                      window.localStorage.setItem(
                        getStorageKey("sound_enabled"),
                        String(checked)
                      );
                    } catch {
                      // ignore
                    }
                  }}
                />
                <span className="text-xs text-muted-foreground">
                  {soundEnabled ? "On" : "Off"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Volume</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-32"
                  disabled={!soundEnabled}
                  aria-label="Sound volume"
                />
              </div>
            </div>
          </div>

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
            <div className="flex items-center gap-2 justify-between md:justify-end">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={viewMode === "cards" ? "default" : "outline"}
                  onClick={() => setViewMode("cards")}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Cards
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={viewMode === "table" ? "default" : "outline"}
                  onClick={() => setViewMode("table")}
                >
                  <TableIcon className="h-4 w-4 mr-2" />
                  Table
                </Button>
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
        viewMode === "table" ? (
          <OrdersTable
            orders={paginated}
            currency={currency}
            savingOrderId={savingOrderId}
            newOrderSince={newOrderSince}
            onView={handleView}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {paginated.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                currency={currency}
                saving={savingOrderId === order.id}
                isNew={Boolean(newOrderSince[order.id]) && order.status === "pending"}
                onView={handleView}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )
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

      {isMobile ? (
        <OrderDetailsModal
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          order={selectedOrder}
          currency={currency}
          saving={selectedOrder ? savingOrderId === selectedOrder.id : false}
          onStatusChange={handleStatusChange}
          onRequestCancel={() => setConfirmCancelOpen(true)}
        />
      ) : (
        <OrderDetailsSheet
          open={detailsOpen}
          onOpenChange={(o) => setDetailsOpen(o)}
          order={selectedOrder}
          currency={currency}
          saving={selectedOrder ? savingOrderId === selectedOrder.id : false}
          onStatusChange={handleStatusChange}
          onRequestCancel={() => setConfirmCancelOpen(true)}
        />
      )}

      <ConfirmDialog
        open={confirmCancelOpen}
        onOpenChange={setConfirmCancelOpen}
        title="Cancel this order?"
        description="Inventory will be restored. This action cannot be undone."
        confirmLabel="Cancel order"
        onConfirm={async () => {
          const o = selectedOrder;
          if (!o) return;
          setConfirmCancelOpen(false);
          await handleStatusChange(o.id, "cancelled");
        }}
        confirmDisabled={!selectedOrder || savingOrderId === selectedOrder?.id || selectedOrder?.status === "completed" || selectedOrder?.status === "cancelled"}
      />
    </div>
  );
}


