/**
 * Admin API: Activity Logs
 * GET /api/admin/activity - View admin activity logs
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const action_type = searchParams.get("action_type");
    const restaurant_id = searchParams.get("restaurant_id");
    const limit = parseInt(searchParams.get("limit") || "100");

    let query = supabase
      .from("admin_activity_logs")
      .select(
        `
        *,
        admin:admin_users!admin_id(id, full_name, email),
        restaurant:restaurants!restaurant_id(id, name)
      `
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (action_type) {
      query = query.eq("action_type", action_type);
    }

    if (restaurant_id) {
      query = query.eq("restaurant_id", restaurant_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Admin activity fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch activity logs",
      },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 403 : 500 }
    );
  }
}
