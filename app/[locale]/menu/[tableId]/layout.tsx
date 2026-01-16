/**
 * Menu Layout with Enforcement
 * Checks restaurant status and blocks access if menu is disabled
 */

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import TopHeader from "../components/TopHeader";
import { MenuRestaurantProvider } from "../context/MenuRestaurantContext";
import type { Metadata } from "next";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tableId: string }>;
}): Promise<Metadata> {
  const { tableId } = await params;
  const tableIdOrNumber = tableId;
  const supabase = await createClient();
  const cookieStore = await cookies();
  const restaurantIdCookie =
    cookieStore.get("s2d_restaurant_id")?.value ?? null;

  const tableQuery = supabase
    .from("restaurant_tables")
    .select(
      `
      id,
      table_number,
      is_active,
      restaurant_id,
      restaurant:restaurants!restaurant_id(
        id,
        name
      )
    `
    )
    .eq("is_active", true);

  const { data: table } = await (uuidRegex.test(tableIdOrNumber)
    ? tableQuery.eq("id", tableIdOrNumber).maybeSingle()
    : restaurantIdCookie
    ? tableQuery
        .eq("restaurant_id", restaurantIdCookie)
        .eq("table_number", tableIdOrNumber)
        .maybeSingle()
    : tableQuery.eq("table_number", tableIdOrNumber).maybeSingle());

  const restaurant = (() => {
    if (!table) return null;
    const r = (table as unknown as { restaurant?: unknown }).restaurant;
    if (!r) return null;
    if (Array.isArray(r)) return (r[0] ?? null) as unknown;
    return r;
  })() as unknown as { name?: unknown } | null;

  const restaurantName = restaurant?.name ? String(restaurant.name) : "Menu";
  const tableNumber = table?.table_number ? String(table.table_number) : "";

  return {
    title: tableNumber
      ? `${restaurantName} — Table ${tableNumber}`
      : restaurantName,
    description: `Browse the menu and order from your table.`,
  };
}

export default async function MenuLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = await params;
  const supabase = await createClient();

  const cookieStore = await cookies();
  const restaurantIdCookie =
    cookieStore.get("s2d_restaurant_id")?.value ?? null;

  // Get table and restaurant info
  const tableQuery = supabase
    .from("restaurant_tables")
    .select(
      `
      id,
      table_number,
      is_active,
      restaurant_id,
      restaurant:restaurants!restaurant_id(
        id,
        name,
        currency,
        brand_color,
        menu_enabled,
        enforcement_reason
      )
    `
    )
    .eq("is_active", true);

  const { data: table, error: tableError } = await (uuidRegex.test(tableId)
    ? tableQuery.eq("id", tableId).maybeSingle()
    : restaurantIdCookie
    ? tableQuery
        .eq("restaurant_id", restaurantIdCookie)
        .eq("table_number", tableId)
        .maybeSingle()
    : tableQuery.eq("table_number", tableId).maybeSingle());

  // Table not found or inactive
  if (tableError || !table) {
    console.error("[Menu Layout] Table lookup failed", {
      tableId,
      restaurantIdCookie,
      isUUID: uuidRegex.test(tableId),
      error: tableError?.message,
    });
    notFound();
  }

  // Table exists but is inactive
  if (!table.is_active) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full bg-card rounded-2xl border shadow-sm p-8 text-center">
          <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2">
            Table unavailable
          </h1>
          <p className="text-muted-foreground">
            This table is currently inactive. Please contact staff for
            assistance.
          </p>
        </div>
      </div>
    );
  }

  const restaurant = Array.isArray(table.restaurant)
    ? table.restaurant[0]
    : table.restaurant;

  // Critical: Check if restaurant menu is enabled (Commission Enforcement)
  if (!restaurant?.menu_enabled) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full bg-card rounded-2xl border shadow-sm p-8 text-center">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2">
            Menu currently unavailable
          </h1>
          <p className="text-muted-foreground mb-4">
            We&apos;re unable to show the menu at this time. Please contact
            staff to place your order.
          </p>
          {restaurant?.enforcement_reason && (
            <div className="text-sm text-muted-foreground italic mt-4 p-3 bg-muted/30 rounded-xl border">
              {restaurant.enforcement_reason}
            </div>
          )}
          <div className="mt-6 text-sm text-muted-foreground">
            <p className="font-medium">{restaurant?.name}</p>
            <p>Table {table.table_number}</p>
          </div>
        </div>
      </div>
    );
  }

  // Restaurant is active - allow access
  const currency = restaurant?.currency ?? "GMD";
  const brandColor = restaurant?.brand_color ?? "#C84501";

  return (
    <MenuRestaurantProvider
      value={{
        restaurantId: String(restaurant?.id ?? ""),
        restaurantName: restaurant?.name ?? "",
        tableId: String(table.id),
        tableSlug: String(table.id),
        tableNumber: String(table.table_number ?? ""),
        currency: String(currency),
        brandColor: String(brandColor),
      }}
    >
      <TopHeader title={restaurant?.name ?? ""} />
      {children}
    </MenuRestaurantProvider>
  );
}
