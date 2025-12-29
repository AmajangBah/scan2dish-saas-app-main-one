/**
 * Admin: Single Restaurant Detail
 * View detailed information about a specific restaurant
 */

import { requireAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, Store, ShoppingCart, Menu, Table } from "lucide-react";
import { notFound } from "next/navigation";
import RestaurantControls from "../RestaurantControls";

export default async function AdminRestaurantDetail({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  await requireAdmin();
  const { locale, id } = await params;
  const supabase = await createClient();

  // Get restaurant details
  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !restaurant) {
    notFound();
  }

  // Get related data
  const [ordersResult, menuResult, tablesResult, paymentsResult] =
    await Promise.all([
      supabase
        .from("orders")
        .select("*")
        .eq("restaurant_id", id)
        .order("created_at", { ascending: false })
        .limit(10),

      supabase
        .from("menu_items")
        .select("*", { count: "exact" })
        .eq("restaurant_id", id),

      supabase
        .from("restaurant_tables")
        .select("*", { count: "exact" })
        .eq("restaurant_id", id),

      supabase
        .from("commission_payments")
        .select(
          `
          *,
          admin:admin_users!recorded_by(full_name)
        `
        )
        .eq("restaurant_id", id)
        .order("payment_date", { ascending: false })
        .limit(10),
    ]);

  const orders = ordersResult.data || [];
  const menuCount = menuResult.count || 0;
  const tableCount = tablesResult.count || 0;
  const payments = paymentsResult.data || [];

  const commissionBalance =
    restaurant.total_commission_owed - restaurant.total_commission_paid;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/${locale}/admin/restaurants`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Restaurants
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {restaurant.name}
            </h1>
            <p className="text-gray-600 mt-1">{restaurant.phone || "No phone"}</p>
          </div>
          <div className="flex items-center gap-3">
            {restaurant.menu_enabled ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Disabled</span>
              </div>
            )}
            <RestaurantControls restaurant={restaurant} />
          </div>
        </div>
        {restaurant.enforcement_reason && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              <span className="font-medium">Enforcement Reason:</span>{" "}
              {restaurant.enforcement_reason}
            </p>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Orders"
          value={orders.length}
          icon={<ShoppingCart />}
          color="blue"
        />
        <StatCard
          title="Menu Items"
          value={menuCount}
          icon={<Menu />}
          color="green"
        />
        <StatCard
          title="Tables"
          value={tableCount}
          icon={<Table />}
          color="purple"
        />
        <StatCard
          title="Commission Balance"
          value={`$${commissionBalance.toFixed(2)}`}
          icon={<Store />}
          color="orange"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Commission Details
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Commission Rate</span>
              <span className="font-medium">
                {(restaurant.commission_rate * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Total Owed</span>
              <span className="font-medium">
                ${restaurant.total_commission_owed.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Total Paid</span>
              <span className="font-medium text-green-600">
                ${restaurant.total_commission_paid.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600 font-semibold">Balance</span>
              <span className="font-bold text-orange-600">
                ${commissionBalance.toFixed(2)}
              </span>
            </div>
            {restaurant.last_payment_date && (
              <div className="text-sm text-gray-500 pt-2">
                Last payment:{" "}
                {new Date(restaurant.last_payment_date).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Payments
            </h2>
            <Link
              href={`/${locale}/admin/payments?restaurant=${id}`}
              className="text-sm text-orange-600 hover:text-orange-700"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {payments.length > 0 ? (
              payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex justify-between items-start p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">${payment.amount.toFixed(2)}</div>
                    <div className="text-xs text-gray-600">
                      {payment.payment_method} •{" "}
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </div>
                    {payment.reference_number && (
                      <div className="text-xs text-gray-500">
                        Ref: {payment.reference_number}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {payment.admin?.full_name || "Unknown"}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No payments recorded</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          <Link
            href={`/${locale}/admin/orders?restaurant=${id}`}
            className="text-sm text-orange-600 hover:text-orange-700"
          >
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                  Order ID
                </th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                  Date
                </th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                  Status
                </th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                  Total
                </th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                  Commission
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    ${order.total.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-orange-600">
                    ${order.commission_amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No orders yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  }[color];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses}`}>{icon}</div>
      </div>
    </div>
  );
}
