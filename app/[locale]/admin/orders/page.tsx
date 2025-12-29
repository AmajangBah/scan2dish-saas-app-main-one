/**
 * Admin: Global Orders Feed
 * View all orders across all restaurants
 */

import { requireAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminOrders({
  searchParams,
  params,
}: {
  searchParams: Promise<{ restaurant?: string; status?: string }>;
  params: Promise<{ locale: string }>;
}) {
  await requireAdmin();
  const { locale } = await params;
  const search = await searchParams;
  const supabase = await createClient();
  const basePath = `/${locale}/admin/orders`;

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
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant
            </label>
            <form action={basePath} method="get">
              <select
                name="restaurant"
                defaultValue={search.restaurant || ""}
                onChange={(e) => e.target.form?.submit()}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Restaurants</option>
                {restaurants?.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>
            </form>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <form action={basePath} method="get">
              {search.restaurant && (
                <input
                  type="hidden"
                  name="restaurant"
                  value={search.restaurant}
                />
              )}
              <select
                name="status"
                defaultValue={search.status || ""}
                onChange={(e) => e.target.form?.submit()}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </form>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">
            {orders?.length || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900">
            ${orders?.reduce((sum, o) => sum + Number(o.total), 0).toFixed(2) || "0.00"}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Commission</p>
          <p className="text-2xl font-bold text-orange-600">
            ${orders
              ?.reduce((sum, o) => sum + Number(o.commission_amount), 0)
              .toFixed(2) || "0.00"}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Avg Order Value</p>
          <p className="text-2xl font-bold text-gray-900">
            ${orders && orders.length > 0
              ? (
                  orders.reduce((sum, o) => sum + Number(o.total), 0) /
                  orders.length
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
              {orders?.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link
                      href={`/${locale}/admin/restaurants/${order.restaurant?.id}`}
                      className="font-medium text-orange-600 hover:text-orange-700"
                    >
                      {order.restaurant?.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {order.table?.table_number}
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
                    ${order.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-orange-600">
                    ${order.commission_amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!orders || orders.length === 0) && (
            <div className="text-center py-12 text-gray-500">
              <p>No orders found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
