"use client";

import React, { createContext, useContext, useMemo } from "react";

export type MenuRestaurantContextValue = {
  restaurantId: string;
  restaurantName: string;
  /**
   * Internal table UUID (used for pricing + order placement).
   */
  tableId: string;
  /**
   * URL-safe identifier for customer routes (table number).
   * Example: "12"
   */
  tableSlug: string;
  tableNumber: string;
  currency: string;
  brandColor: string;
};

const MenuRestaurantContext = createContext<MenuRestaurantContextValue | undefined>(
  undefined
);

export function MenuRestaurantProvider({
  value,
  children,
}: {
  value: MenuRestaurantContextValue;
  children: React.ReactNode;
}) {
  const memo = useMemo(() => value, [value]);

  return (
    <MenuRestaurantContext.Provider value={memo}>
      {/* Scope per-restaurant branding to the menu subtree */}
      <div
        className="min-h-dvh bg-background text-foreground"
        style={
          {
            // shadcn tokens
            "--primary": memo.brandColor,
            "--sidebar-primary": memo.brandColor,
            // menu-specific token (for arbitrary Tailwind usage)
            "--menu-brand": memo.brandColor,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </MenuRestaurantContext.Provider>
  );
}

export function useMenuRestaurant() {
  const ctx = useContext(MenuRestaurantContext);
  if (!ctx) {
    throw new Error("useMenuRestaurant must be used within MenuRestaurantProvider");
  }
  return ctx;
}

