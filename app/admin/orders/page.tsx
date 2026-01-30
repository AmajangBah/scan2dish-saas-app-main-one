/**
 * Admin: Global Orders Feed
 * View all orders across all restaurants
 */

import { requireAdmin } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { OrdersFilters } from "./OrdersFilters";

export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<{ restaurant?: string; status?: string }>;
}) {
  await requireAdmin();
  const search = await searchParams;
  const supabase = await createServerSupabase();
  const basePath = "/admin/orders";

  // Build query
  let query = supabase
    .from("orders")
    .select(
      `
      *,
      restaurant:restaurants!restaurant_id(id, name, currency),
      table:restaurant_tables!table_id(id, table_number)
    `
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (search.restaurant) {
    query = query.eq("restaurant_id", search.restaurant);
  }

  if (search.status) {
    query = query.eq("status", search.status);
  }

  const { data: orders } = await query;

  // Normalize a few fields for rendering safety (Supabase joins can be object or array).
  type RestaurantJoin = { id: string; name: string; currency?: string | null };
  type TableJoin = { id: string; table_number?: string | null };
  type OrderRow = {
    id: string;
    created_at: string;
    status: string;
    total: number | string | null;
    commission_amount: number | string | null;
    restaurant: RestaurantJoin | RestaurantJoin[] | null;
    table: TableJoin | TableJoin[] | null;
  } & Record<string, unknown>;

  const safeOrders = ((orders as unknown as OrderRow[]) ?? []).map((o) => {
    const restaurant = Array.isArray(o.restaurant) ? o.restaurant[0] : o.restaurant;
    const table = Array.isArray(o.table) ? o.table[0] : o.table;
    const total = Number(o.total ?? 0);
    const commission = Number(o.commission_amount ?? 0);
    return { ...o, restaurant, table, total, commission_amount: commission };
  });

  // Get restaurants for filter
  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id, name")
    .order("name");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-1">
          View all orders across all restaurants
        </p>
      </div>

      {/* Filters */}
      <OrdersFilters
        basePath={basePath}
        restaurants={restaurants ?? []}
        initialRestaurantId={search.restaurant || ""}
        initialStatus={search.status || ""}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">
            {safeOrders.length || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900">
            $
            {safeOrders
              .reduce((sum, o) => sum + Number(o.total ?? 0), 0)
              .toFixed(2) || "0.00"}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Commission</p>
          <p className="text-2xl font-bold text-orange-600">
            $
            {safeOrders
              .reduce((sum, o) => sum + Number(o.commission_amount ?? 0), 0)
              .toFixed(2) || "0.00"}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Avg Order Value</p>
          <p className="text-2xl font-bold text-gray-900">
            ${safeOrders.length > 0
              ? (
                  safeOrders.reduce((sum, o) => sum + Number(o.total ?? 0), 0) /
                  safeOrders.length
                ).toFixed(2)
              : "0.00"}
          </p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Order ID
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Restaurant
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Table
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Commission
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {safeOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono">
                    {String(order.id).slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link
                      href={
                        order.restaurant?.id
                          ? `/admin/restaurants/${order.restaurant.id}`
                          : "/admin/restaurants"
                      }
                      className="font-medium text-orange-600 hover:text-orange-700"
                    >
                      {order.restaurant?.name ?? "Unknown"}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {order.table?.table_number ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(order.created_at).toLocaleDateString()}
                    <div className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs capitalize ${
                        order.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : order.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : order.status === "preparing"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    ${Number(order.total ?? 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-orange-600">
                    ${Number(order.commission_amount ?? 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {safeOrders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No orders found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
