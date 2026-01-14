"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  kitchenFetchLowStock,
  kitchenFetchOrders,
  kitchenLogout,
  kitchenUpdateOrderStatus,
  type KitchenLowStockIngredient,
  type KitchenOrder,
  type KitchenOrderStatus,
} from "@/app/actions/kitchen";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { playKitchenNotification } from "@/lib/services/kitchenAudioService";

function storageKey(restaurantId: string, key: string) {
  return `s2d_kitchen_${restaurantId}_${key}`;
}

function nowMs() {
  return Date.now();
}

function formatAge(minutesAgo: number) {
  if (minutesAgo <= 0) return "Just now";
  if (minutesAgo === 1) return "1 min";
  return `${minutesAgo} min`;
}

export default function KitchenClient({
  restaurantId,
  restaurantName,
}: {
  restaurantId: string;
  restaurantName: string;
}) {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<"live" | "reconnecting">("live");
  const [highlightSince, setHighlightSince] = useState<Record<string, number>>(
    {}
  );
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [lowStock, setLowStock] = useState<KitchenLowStockIngredient[]>([]);
  const [lowStockOpen, setLowStockOpen] = useState(false);

  // Track notified order IDs to prevent duplicate notifications
  const notifiedIdsRef = useRef<Set<string>>(new Set());
  const ordersRef = useRef<KitchenOrder[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(
        window.localStorage.getItem(
          storageKey(restaurantId, "notified_order_ids")
        ) || "[]"
      ) as string[];
      notifiedIdsRef.current = new Set(stored);
    } catch {
      // ignore
    }
  }, [restaurantId]);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  function rememberNotified(orderId: string) {
    if (notifiedIdsRef.current.has(orderId)) return;
    notifiedIdsRef.current.add(orderId);
    try {
      const key = storageKey(restaurantId, "notified_order_ids");
      const existing = JSON.parse(
        window.localStorage.getItem(key) || "[]"
      ) as string[];
      const next = [orderId, ...existing.filter((x) => x !== orderId)].slice(
        0,
        250
      );
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // ignore
    }
    setHighlightSince((prev) =>
      prev[orderId] ? prev : { ...prev, [orderId]: nowMs() }
    );
    // Event-driven trigger: play notification immediately when new order arrives
    playKitchenNotification().catch((error) => {
      console.error("[Kitchen] Failed to play notification:", error);
    });
  }

  async function refreshOnce({ allowChime }: { allowChime: boolean }) {
    try {
      setError(null);
      const data = await kitchenFetchOrders(restaurantId);
      setOrders((prev) => {
        const prevIds = new Set(prev.map((o) => o.id));
        if (allowChime) {
          for (const o of data) {
            if (o.status === "pending" && !prevIds.has(o.id)) {
              rememberNotified(o.id);
            }
          }
        }
        return data;
      });
      setLiveStatus("live");
    } catch (e) {
      setLiveStatus("reconnecting");
      setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // initial load: do NOT chime on existing orders
    refreshOnce({ allowChime: false }).catch(() => {});

    const interval = window.setInterval(() => {
      refreshOnce({ allowChime: true }).catch(() => {});
    }, 3000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await kitchenFetchLowStock(restaurantId);
        if (!cancelled) setLowStock(data);
      } catch {
        // ignore (kitchen must keep running even if inventory fails)
      }
    }
    load();
    const t = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [restaurantId]);

  // Expire highlights after 2 minutes
  useEffect(() => {
    const t = window.setInterval(() => {
      const cutoff = nowMs() - 2 * 60_000;
      setHighlightSince((prev) => {
        const next: Record<string, number> = {};
        for (const [id, ts] of Object.entries(prev)) {
          if (ts >= cutoff) next[id] = ts;
        }
        return next;
      });
    }, 15_000);
    return () => window.clearInterval(t);
  }, []);

  const columns = useMemo(() => {
    const pending = orders.filter((o) => o.status === "pending");
    const preparing = orders.filter((o) => o.status === "preparing");
    const completed = orders
      .filter((o) => o.status === "completed")
      .slice(0, 30);
    return { pending, preparing, completed };
  }, [orders]);

  async function setStatus(orderId: string, status: KitchenOrderStatus) {
    setSavingOrderId(orderId);
    try {
      await kitchenUpdateOrderStatus({ restaurantId, orderId, status });
      // immediate refresh
      await refreshOnce({ allowChime: false });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setSavingOrderId(null);
    }
  }

  return (
    <div className="min-h-dvh bg-black text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-50 border-b border-neutral-800 bg-black/95 backdrop-blur">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs tracking-wide text-neutral-400 uppercase">
              Kitchen View
            </div>
            <div className="text-xl sm:text-2xl font-semibold truncate">
              {restaurantName}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400">
              <span
                className={cn(
                  "inline-block h-2.5 w-2.5 rounded-full",
                  liveStatus === "live"
                    ? "bg-emerald-400"
                    : "bg-amber-400 animate-pulse"
                )}
              />
              {liveStatus === "live" ? "Live" : "Reconnecting…"}
            </div>

            <Button
              type="button"
              variant="outline"
              className={cn(
                "border-neutral-700 text-white bg-transparent hover:bg-neutral-900 hover:text-green-400",
                lowStock.length > 0 && "border-amber-500/60"
              )}
              onClick={() => setLowStockOpen(true)}
            >
              Low stock: {lowStock.length}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="border-neutral-700 text-white bg-transparent hover:bg-neutral-900  hover:text-green-400"
              onClick={async () => {
                await kitchenLogout(restaurantId);
                window.location.reload();
              }}
            >
              Lock
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-[1400px] px-4 py-4">
        {lowStock.length > 0 && (
          <div className="mb-4 rounded-xl border border-amber-700/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
            <div className="font-semibold">Low stock warning</div>
            <div className="text-amber-200/80">
              {lowStock
                .slice(0, 3)
                .map((i) => i.name)
                .join(", ")}
              {lowStock.length > 3 ? ` +${lowStock.length - 3} more` : ""}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-neutral-400">Loading orders…</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <KitchenColumn
              title="NEW"
              count={columns.pending.length}
              tone="new"
              orders={columns.pending}
              highlightSince={highlightSince}
              savingOrderId={savingOrderId}
              onPrimary={(id) => setStatus(id, "preparing")}
              onSecondary={(id) => setStatus(id, "completed")}
              primaryLabel="Start"
              secondaryLabel="Ready"
            />

            <KitchenColumn
              title="PREPARING"
              count={columns.preparing.length}
              tone="preparing"
              orders={columns.preparing}
              highlightSince={highlightSince}
              savingOrderId={savingOrderId}
              onPrimary={(id) => setStatus(id, "completed")}
              onSecondary={(id) => setStatus(id, "pending")}
              primaryLabel="Ready"
              secondaryLabel="Back"
            />

            <KitchenColumn
              title="READY"
              count={columns.completed.length}
              tone="ready"
              orders={columns.completed}
              highlightSince={highlightSince}
              savingOrderId={savingOrderId}
              onPrimary={(id) => setStatus(id, "preparing")}
              onSecondary={(id) => setStatus(id, "pending")}
              primaryLabel="Undo"
              secondaryLabel="Back"
            />
          </div>
        )}
      </div>

      {/* Low stock overlay (minimal) */}
      {lowStockOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setLowStockOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-950 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-extrabold">Low stock</div>
                <div className="text-sm text-neutral-400">
                  Ingredients at or below their minimum threshold.
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="border-neutral-700 text-white bg-transparent hover:bg-white"
                onClick={() => setLowStockOpen(false)}
              >
                Close
              </Button>
            </div>

            <div className="mt-4 space-y-2 max-h-[60dvh] overflow-auto">
              {lowStock.length === 0 ? (
                <div className="text-sm text-neutral-400">No low stock.</div>
              ) : (
                lowStock.map((i) => (
                  <div
                    key={i.id}
                    className="rounded-xl border border-neutral-800 bg-black px-4 py-3 flex items-center justify-between"
                  >
                    <div className="font-semibold">{i.name}</div>
                    <div className="text-sm text-amber-200 tabular-nums">
                      {i.current_quantity} / {i.min_threshold} {i.unit}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KitchenColumn({
  title,
  count,
  tone,
  orders,
  highlightSince,
  savingOrderId,
  onPrimary,
  onSecondary,
  primaryLabel,
  secondaryLabel,
}: {
  title: string;
  count: number;
  tone: "new" | "preparing" | "ready";
  orders: KitchenOrder[];
  highlightSince: Record<string, number>;
  savingOrderId: string | null;
  onPrimary: (orderId: string) => void;
  onSecondary: (orderId: string) => void;
  primaryLabel: string;
  secondaryLabel: string;
}) {
  const headerTone =
    tone === "new"
      ? "bg-red-600"
      : tone === "preparing"
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden">
      <div
        className={cn(
          "px-4 py-3 flex items-center justify-between",
          headerTone
        )}
      >
        <div className="text-lg font-extrabold tracking-wide">{title}</div>
        <div className="text-sm font-semibold bg-black/25 px-3 py-1 rounded-full">
          {count}
        </div>
      </div>

      <div className="p-3 space-y-3 max-h-[calc(100dvh-160px)] overflow-auto">
        {orders.length === 0 ? (
          <div className="text-sm text-neutral-500 px-2 py-6 text-center">
            No orders
          </div>
        ) : (
          orders.map((o) => (
            <div
              key={o.id}
              className={cn(
                "rounded-2xl border border-neutral-800 bg-black p-4",
                highlightSince[o.id] &&
                  tone === "new" &&
                  "ring-2 ring-red-500/50"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-2xl font-extrabold">Table {o.table}</div>
                  <div className="text-sm text-neutral-400 mt-1">
                    {formatAge(o.minutesAgo)} •{" "}
                    {new Date(o.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                {highlightSince[o.id] && tone === "new" && (
                  <div className="text-xs font-semibold text-red-200 bg-red-950/60 border border-red-900/40 px-2 py-1 rounded-full">
                    NEW
                  </div>
                )}
              </div>

              {o.notes && (
                <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2">
                  <div className="text-xs tracking-wide text-neutral-400 uppercase">
                    Notes
                  </div>
                  <div className="text-sm mt-1 whitespace-pre-wrap">
                    {o.notes}
                  </div>
                </div>
              )}

              <div className="mt-3 space-y-2">
                {o.items.map((it, idx) => (
                  <div
                    key={`${o.id}-${idx}-${it.name}`}
                    className="flex items-start justify-between gap-3"
                  >
                    <div className="text-base font-semibold">{it.name}</div>
                    <div className="text-base font-extrabold tabular-nums">
                      ×{it.qty}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  onClick={() => onPrimary(o.id)}
                  disabled={savingOrderId === o.id}
                  className="h-12 text-base font-extrabold"
                >
                  {savingOrderId === o.id ? "…" : primaryLabel}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onSecondary(o.id)}
                  disabled={savingOrderId === o.id}
                  className="h-12 text-base font-bold border-neutral-700 bg-transparent text-white hover:bg-green-400"
                >
                  {secondaryLabel}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
