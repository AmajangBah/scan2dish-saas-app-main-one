/**
 * Admin API: Commission Payment Recording
 * POST /api/admin/payments - Record a commission payment
 * GET /api/admin/payments - List all payments
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminActivity } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const {
      restaurant_id,
      send_receipt,
      amount,
      payment_method,
      reference_number,
      notes,
    } = body;

    // Validation
    if (!restaurant_id || !amount || !payment_method) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: restaurant_id, amount, payment_method",
        },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Amount must be greater than 0",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Use the database function to record payment
    const { data, error } = await supabase.rpc("record_commission_payment", {
      rest_id: restaurant_id,
      pay_amount: amount,
      pay_method: payment_method,
      pay_reference: reference_number || null,
      pay_notes: notes || null,
      admin_id: admin.id,
    });

    if (error) throw error;

    // Optionally mark receipt as "sent to restaurant dashboard"
    // (No email/SMS integration here; restaurants will see it in Billing > Receipts.)
    if (send_receipt !== false && data) {
      await supabase
        .from("commission_payments")
        .update({
          receipt_sent_at: new Date().toISOString(),
          receipt_sent_via: "dashboard",
          receipt_sent_by: admin.id,
        })
        .eq("id", data);
    }

    // Log activity
    await logAdminActivity({
      action_type: "payment_recorded",
      restaurant_id,
      details: {
        amount,
        payment_method,
        reference_number,
        send_receipt: send_receipt !== false,
      },
    });

    return NextResponse.json({
      success: true,
      data: { payment_id: data },
    });
  } catch (error) {
    console.error("Admin payment recording error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to record payment",
      },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 403 : 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const restaurant_id = searchParams.get("restaurant_id");

    let query = supabase
      .from("commission_payments")
      .select(
        `
        *,
        restaurant:restaurants!restaurant_id(id, name),
        admin:admin_users!recorded_by(id, full_name)
      `
      )
      .order("payment_date", { ascending: false })
      .limit(100);

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
    console.error("Admin payments fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch payments",
      },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 403 : 500 }
    );
  }
}
