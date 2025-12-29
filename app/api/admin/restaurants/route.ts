/**
 * Admin API: Restaurant Management
 * GET /api/admin/restaurants - List all restaurants with stats
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminActivity } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status"); // 'all', 'active', 'disabled'
    const search = searchParams.get("search");

    let query = supabase
      .from("restaurants")
      .select(
        `
        id,
        name,
        phone,
        currency,
        menu_enabled,
        enforcement_reason,
        last_payment_date,
        total_commission_owed,
        total_commission_paid,
        commission_rate,
        created_at,
        updated_at
      `
      )
      .order("created_at", { ascending: false });

    // Filter by status
    if (status === "active") {
      query = query.eq("menu_enabled", true);
    } else if (status === "disabled") {
      query = query.eq("menu_enabled", false);
    }

    // Search by name
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data: restaurants, error } = await query;

    if (error) throw error;

    // Get counts for each restaurant
    const restaurantsWithStats = await Promise.all(
      (restaurants || []).map(async (restaurant) => {
        // Get order count
        const { count: orderCount } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("restaurant_id", restaurant.id);

        // Get menu items count
        const { count: menuCount } = await supabase
          .from("menu_items")
          .select("*", { count: "exact", head: true })
          .eq("restaurant_id", restaurant.id);

        // Get table count
        const { count: tableCount } = await supabase
          .from("restaurant_tables")
          .select("*", { count: "exact", head: true })
          .eq("restaurant_id", restaurant.id);

        // Calculate commission balance
        const commissionBalance =
          restaurant.total_commission_owed - restaurant.total_commission_paid;

        return {
          ...restaurant,
          order_count: orderCount || 0,
          menu_count: menuCount || 0,
          table_count: tableCount || 0,
          commission_balance: commissionBalance,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: restaurantsWithStats,
    });
  } catch (error) {
    console.error("Admin restaurants fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch restaurants",
      },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 403 : 500 }
    );
  }
}
