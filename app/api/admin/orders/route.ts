/**
 * Admin API: Global Orders Feed
 * GET /api/admin/orders - View all orders across all restaurants
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const supabase = await createServerSupabase();
    const searchParams = request.nextUrl.searchParams;
    const restaurant_id = searchParams.get("restaurant_id");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

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
      .limit(limit);

    if (restaurant_id) {
      query = query.eq("restaurant_id", restaurant_id);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data: orders, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Admin orders fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch orders",
      },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 403 : 500 }
    );
  }
}
