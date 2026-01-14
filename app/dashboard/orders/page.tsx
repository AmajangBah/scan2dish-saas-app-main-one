import { createServerSupabase } from "@/lib/supabase/server";
import { requireRestaurantPage } from "@/lib/auth/restaurant";
import OrdersClient from "./OrdersClient";
import { Order } from "./types";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const ctx = await requireRestaurantPage();
  const restaurant_id = ctx.restaurant.id;
  const currency = ctx.restaurant.currency ?? "GMD";
  const restaurantName = ctx.restaurant.name ?? "Restaurant";

  const supabase = await createServerSupabase();

  // Fetch orders with table information
  const { data: orders, error } = await supabase
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
      restaurant_tables!inner(table_number)
    `
    )
    .eq("restaurant_id", restaurant_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch orders:", error);
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="text-center text-red-600">
          Failed to load orders. Please try again later.
        </div>
      </div>
    );
  }

  // Map database orders to UI Order type
  type OrderRow = {
    id: string;
    status: "pending" | "preparing" | "completed";
    total: number | string | null;
    items: unknown;
    customer_name: string | null;
    notes: string | null;
    created_at: string;
    restaurant_tables:
      | { table_number?: string }[]
      | { table_number?: string }
      | null
      | undefined;
  };

  const mappedOrders: Order[] = ((orders as unknown as OrderRow[]) || []).map(
    (o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      const orderItems = items.map(
        (item: {
          name?: string;
          quantity?: number;
          price?: string | number;
        }) => ({
          name: item.name || "Unknown Item",
          qty: item.quantity || 1,
          price: parseFloat(String(item.price || 0)),
        })
      );

      const rt = o.restaurant_tables;
      const tableNumber = Array.isArray(rt)
        ? rt[0]?.table_number
        : rt?.table_number;

      return {
        id: o.id,
        table: tableNumber || "Unknown",
        status: o.status as "pending" | "preparing" | "completed",
        total: Number(o.total || 0).toFixed(2),
        time: new Date(o.created_at).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: String(o.created_at),
        items: orderItems,
        customerName: o.customer_name ? String(o.customer_name) : null,
        notes: o.notes ? String(o.notes) : null,
      };
    }
  );

  return (
    <OrdersClient
      restaurantId={restaurant_id}
      currency={currency}
      restaurantName={restaurantName}
      initialOrders={mappedOrders}
    />
  );
}
