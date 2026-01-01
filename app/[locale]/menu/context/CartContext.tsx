"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

interface CartContextValue {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  updateQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function storageKey(tableId: string | null) {
  // Scope cart to a table to avoid cross-table leakage in real restaurants.
  return tableId ? `s2d_cart_${tableId}` : "s2d_cart";
}

function loadCartFromStorage(tableId: string | null): CartItem[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(storageKey(tableId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((it) => {
        if (!it || typeof it !== "object") return null;
        const r = it as Record<string, unknown>;
        const id = typeof r.id === "string" ? r.id : "";
        const name = typeof r.name === "string" ? r.name : "";
        const price = typeof r.price === "number" ? r.price : Number(r.price);
        const qty = typeof r.qty === "number" ? r.qty : Number(r.qty);
        const image = typeof r.image === "string" ? r.image : undefined;
        if (!id || !name || !Number.isFinite(price) || !Number.isFinite(qty)) return null;
        return { id, name, price, qty: Math.max(1, Math.floor(qty)), image };
      })
      .filter(Boolean) as CartItem[];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const tableId = typeof params.tableId === "string" ? params.tableId : null;

  const [items, setItems] = useState<CartItem[]>(() => loadCartFromStorage(tableId));

  // Persist cart to localStorage (best-effort).
  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey(tableId), JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, tableId]);

  const add = (item: Omit<CartItem, "qty">, qty = 1) => {
    const safeQty = Number.isFinite(qty) ? Math.max(1, Math.floor(qty)) : 1;
    setItems((prev) => {
      const found = prev.find((p) => p.id === item.id);
      if (found) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, qty: p.qty + safeQty } : p
        );
      }
      return [...prev, { ...item, qty: safeQty }];
    });
  };

  const updateQty = (id: string, qty: number) => {
    const safeQty = Number.isFinite(qty) ? Math.max(1, Math.floor(qty)) : 1;
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, qty: safeQty } : p)));
  };

  const remove = (id: string) =>
    setItems((prev) => prev.filter((p) => p.id !== id));
  const clear = () => setItems([]);

  const subtotal = useMemo(() => items.reduce((s, it) => s + it.price * it.qty, 0), [items]);

  return (
    <CartContext.Provider
      value={{ items, add, updateQty, remove, clear, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
