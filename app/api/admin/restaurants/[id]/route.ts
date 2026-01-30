/**
 * Admin API: Single Restaurant Operations
 * GET /api/admin/restaurants/[id] - Get restaurant details
 * PATCH /api/admin/restaurants/[id] - Update restaurant (enable/disable menu)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminActivity } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const supabase = await createServerSupabase();

    // Get restaurant details
    const { data: restaurant, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    // Get related stats
    const [ordersResult, menuResult, tablesResult, paymentsResult] = await Promise.all([
      supabase
        .from("orders")
        .select("id, total, commission_amount, status, created_at")
        .eq("restaurant_id", id)
        .order("created_at", { ascending: false })
        .limit(10),

      supabase
        .from("menu_items")
        .select("*", { count: "exact", head: true })
        .eq("restaurant_id", id),

      supabase
        .from("restaurant_tables")
        .select("*", { count: "exact", head: true })
        .eq("restaurant_id", id),

      supabase
        .from("commission_payments")
        .select("*")
        .eq("restaurant_id", id)
        .order("payment_date", { ascending: false })
        .limit(10),
    ]);

    // Log activity
    await logAdminActivity({
      action_type: "restaurant_viewed",
      restaurant_id: id,
    });

    return NextResponse.json({
      success: true,
      data: {
        restaurant,
        recent_orders: ordersResult.data || [],
        menu_count: menuResult.count || 0,
        table_count: tablesResult.count || 0,
        recent_payments: paymentsResult.data || [],
        commission_balance:
          restaurant.total_commission_owed - restaurant.total_commission_paid,
      },
    });
  } catch (error) {
    console.error("Admin restaurant fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch restaurant",
      },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 403 : 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const supabase = await createServerSupabase();

    const updateData: {
      menu_enabled?: boolean;
      enforcement_reason?: string | null;
    } = {};

    if (typeof body.menu_enabled === "boolean") {
      updateData.menu_enabled = body.menu_enabled;
    }

    if (body.enforcement_reason !== undefined) {
      updateData.enforcement_reason = body.enforcement_reason;
    }

    const { data, error } = await supabase
      .from("restaurants")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logAdminActivity({
      action_type: body.menu_enabled ? "menu_enabled" : "menu_disabled",
      restaurant_id: id,
      details: {
        enforcement_reason: body.enforcement_reason,
      },
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Admin restaurant update error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update restaurant",
      },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 403 : 500 }
    );
  }
}
