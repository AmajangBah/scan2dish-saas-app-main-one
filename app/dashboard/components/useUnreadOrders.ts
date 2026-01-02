"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

function storageKey(restaurantId: string) {
  return `s2d_orders_seen_at_${restaurantId}`;
}

function readSeenAtMs(restaurantId: string) {
  try {
    const raw = window.localStorage.getItem(storageKey(restaurantId));
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeSeenAtMs(restaurantId: string, ms: number) {
  try {
    window.localStorage.setItem(storageKey(restaurantId), String(ms));
  } catch {
    // ignore
  }
}

/**
 * Lightweight realtime unread badge:
 * - Unread = pending orders created since last time Orders page was opened.
 * - "Seen" is tracked client-side via localStorage (per device).
 */
export function useUnreadOrdersBadge(restaurantId: string) {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [unreadCount, setUnreadCount] = useState(0);
  const mountedRef = useRef(false);

  const refresh = useCallback(async () => {
    const stored = readSeenAtMs(restaurantId);
    // Avoid huge badges on first run: initialize "seen" to now.
    const seen = stored ?? Date.now();
    if (stored == null) writeSeenAtMs(restaurantId, seen);

    const sinceIso = new Date(seen).toISOString();
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .eq("status", "pending")
      .gt("created_at", sinceIso);

    setUnreadCount(count ?? 0);
  }, [restaurantId, supabase]);

  useEffect(() => {
    mountedRef.current = true;
    // Defer so we don't synchronously set state from the effect body.
    const t = window.setTimeout(() => {
      refresh().catch(() => {});
    }, 0);

    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey(restaurantId)) return;
      refresh().catch(() => {});
    };
    const onSeenUpdated = () => refresh().catch(() => {});
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh().catch(() => {});
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("s2d_orders_seen_updated", onSeenUpdated as EventListener);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(
        "s2d_orders_seen_updated",
        onSeenUpdated as EventListener
      );
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh, restaurantId]);

  useEffect(() => {
    const channel = supabase
      .channel(`restaurant-orders-badge-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          // Keep it simple/reliable: re-count on any change.
          // (Pending orders can be created or moved out of pending.)
          refresh().catch(() => {});
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, refresh, supabase]);

  return {
    unreadCount,
    hasUnread: unreadCount > 0,
  };
}

/**
 * Helper used by the Orders page to mark all current orders as "seen".
 */
export function markOrdersSeenNow(restaurantId: string) {
  const now = Date.now();
  writeSeenAtMs(restaurantId, now);
  try {
    window.dispatchEvent(new Event("s2d_orders_seen_updated"));
  } catch {
    // ignore
  }
}

