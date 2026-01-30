/**
 * Admin API: Dashboard Metrics
 * GET /api/admin/dashboard - Get platform-wide statistics
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await requireAdmin();

    const supabase = await createServerSupabase();

    // Best-effort refresh of the materialized view powering metrics.
    try {
      await supabase.rpc("refresh_admin_dashboard_metrics");
    } catch (e) {
      console.warn("Failed to refresh admin dashboard metrics:", e);
    }

    // Get metrics from materialized view
    const { data: metrics, error: metricsError } = await supabase
      .from("admin_dashboard_metrics")
      .select("*")
      .single();

    if (metricsError) {
      console.error("Metrics error:", metricsError);
    }

    // Get recent activity
    const { data: recentActivity, error: activityError } = await supabase
      .from("admin_activity_logs")
      .select(
        `
        *,
        admin:admin_users!admin_id(full_name),
        restaurant:restaurants!restaurant_id(name)
      `
      )
      .order("created_at", { ascending: false })
      .limit(20);

    if (activityError) {
      console.error("Activity error:", activityError);
    }

    // Get restaurants with overdue commission
    const { data: overdueRestaurants, error: overdueError } = await supabase
      .from("restaurants")
      .select("id, name, total_commission_owed, total_commission_paid, last_payment_date")
      .gt("total_commission_owed", 0)
      .order("total_commission_owed", { ascending: false })
      .limit(10);

    if (overdueError) {
      console.error("Overdue error:", overdueError);
    }

    // Calculate overdue amounts
    const overdueWithBalance = (overdueRestaurants || []).map((r) => ({
      ...r,
      commission_balance: r.total_commission_owed - r.total_commission_paid,
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          metrics: metrics || {
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
            total_commission_owed: 0,
            total_commission_paid: 0,
            commission_outstanding: 0,
          },
          recent_activity: recentActivity || [],
          overdue_restaurants: overdueWithBalance,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Admin dashboard fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch dashboard data",
      },
      {
        status:
          error instanceof Error && error.message.includes("Unauthorized")
            ? 403
            : 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}
