/**
 * Admin Dashboard
 * Overview of platform metrics and activity
 */

import { requireAdmin } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  Store,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDashboard({
}) {
  await requireAdmin();
  const supabase = await createServerSupabase();

  // Ensure materialized metrics are up-to-date.
  // This is intentionally best-effort: the dashboard should still render if refresh fails.
  try {
    await supabase.rpc("refresh_admin_dashboard_metrics");
  } catch (e) {
    console.warn("Failed to refresh admin dashboard metrics:", e);
  }

  // Get dashboard metrics
  const { data: metrics } = await supabase
    .from("admin_dashboard_metrics")
    .select("*")
    .single();

  // Get recent activity
  const { data: recentActivity } = await supabase
    .from("admin_activity_logs")
    .select(
      `
      *,
      admin:admin_users!admin_id(full_name),
      restaurant:restaurants!restaurant_id(name)
    `
    )
    .order("created_at", { ascending: false })
    .limit(10);

  // Get restaurants with outstanding commission
  const { data: overdueRestaurants } = await supabase
    .from("restaurants")
    .select(
      "id, name, total_commission_owed, total_commission_paid, last_payment_date, menu_enabled"
    )
    .gt("total_commission_owed", 0)
    .order("total_commission_owed", { ascending: false })
    .limit(5);

  const m = metrics || {
    total_restaurants: 0,
    active_restaurants: 0,
    disabled_restaurants: 0,
    total_orders: 0,
    orders_last_24h: 0,
    orders_last_7d: 0,
    orders_last_30d: 0,
    total_revenue: 0,
    revenue_last_24h: 0,
    revenue_last_7d: 0,
    revenue_last_30d: 0,
    total_commission_generated: 0,
    commission_last_30d: 0,
    commission_outstanding: 0,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Admin dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Platform overview and key metrics.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Restaurants"
          value={m.total_restaurants}
          icon={<Store />}
          color="blue"
          subtitle={`${m.active_restaurants} active, ${m.disabled_restaurants} disabled`}
        />
        <MetricCard
          title="Orders (30d)"
          value={m.orders_last_30d}
          icon={<ShoppingCart />}
          color="green"
          subtitle={`${m.orders_last_24h} in last 24h`}
        />
        <MetricCard
          title="Revenue (30d)"
          value={`$${Number(m.revenue_last_30d || 0).toFixed(2)}`}
          icon={<TrendingUp />}
          color="purple"
          subtitle={`$${Number(m.revenue_last_24h || 0).toFixed(2)} today`}
        />
        <MetricCard
          title="Commission Outstanding"
          value={`$${Number(m.commission_outstanding || 0).toFixed(2)}`}
          icon={<DollarSign />}
          color="orange"
          subtitle={`$${Number(m.commission_last_30d || 0).toFixed(
            2
          )} generated (30d)`}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Outstanding Commission */}
        <div className="bg-card rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Outstanding Commission
            </h2>
            <Link
              href="/admin/payments"
              className="text-sm text-orange-600 hover:text-orange-700"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {overdueRestaurants && overdueRestaurants.length > 0 ? (
              overdueRestaurants.map((restaurant) => {
                const balance =
                  restaurant.total_commission_owed -
                  restaurant.total_commission_paid;
                return (
                  <div
                    key={restaurant.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {restaurant.menu_enabled ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <div className="font-medium text-sm">
                          {restaurant.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {restaurant.last_payment_date
                            ? `Last payment: ${new Date(
                                restaurant.last_payment_date
                              ).toLocaleDateString()}`
                            : "No payments yet"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-orange-600">
                        ${balance.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No outstanding commission</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
            <Link
              href="/admin/activity"
              className="text-sm text-orange-600 hover:text-orange-700"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg text-sm border"
                >
                  <ActivityIcon action={log.action_type} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">
                      {formatActionType(log.action_type)}
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {log.restaurant?.name || "N/A"} •{" "}
                      {log.admin?.full_name || "Unknown"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  }[color];

  return (
    <div className="bg-card rounded-xl border shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses}`}>{icon}</div>
      </div>
    </div>
  );
}

function ActivityIcon({ action }: { action: string }) {
  if (action.includes("enabled")) {
    return <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />;
  }
  if (action.includes("disabled")) {
    return <XCircle className="h-5 w-5 text-red-500 shrink-0" />;
  }
  if (action.includes("payment")) {
    return <DollarSign className="h-5 w-5 text-green-500 shrink-0" />;
  }
  return <AlertTriangle className="h-5 w-5 text-gray-400 shrink-0" />;
}

function formatActionType(action: string): string {
  return action
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
