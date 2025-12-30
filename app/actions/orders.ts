"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { CreateOrderSchema, type CreateOrderInput } from "@/lib/validations/orders";
import { revalidatePath } from "next/cache";

export interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

/**
 * Server Action to create an order
 * 
 * This function:
 * 1. Validates table_id exists and is active
 * 2. Places the order atomically in the database (includes inventory deduction + discounts)
 * 3. Returns order ID
 * 
 * Security: All price calculations happen server-side
 * 
 * @param input - Order creation input (table_id, items, customer_name, notes)
 * @returns Order creation result with order ID or error
 */
export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  try {
    // 1. Validate input schema
    const validatedInput = CreateOrderSchema.parse(input);
    const supabase = await createServerSupabase();

    const itemsPayload = validatedInput.items.map((i) => ({
      id: i.id,
      qty: i.qty,
    }));

    const { data: orderId, error: rpcError } = await supabase.rpc(
      "place_order_atomic",
      {
        p_table_id: validatedInput.table_id,
        p_items: itemsPayload,
        p_customer_name: validatedInput.customer_name ?? null,
        p_notes: validatedInput.notes ?? null,
      }
    );

    if (rpcError || !orderId) {
      const msg = rpcError?.message || "Failed to create order";
      if (msg.includes("INSUFFICIENT_STOCK")) {
        return { success: false, error: "Out of stock. Please update your cart." };
      }
      if (msg.includes("ITEM_UNAVAILABLE_OR_OUT_OF_STOCK")) {
        return { success: false, error: "Some items are unavailable or out of stock." };
      }
      if (msg.includes("TABLE_NOT_FOUND_OR_INACTIVE")) {
        return { success: false, error: "Table not found or inactive" };
      }
      if (msg.includes("INVALID")) {
        return { success: false, error: "Invalid order" };
      }
      console.error("Order creation error:", rpcError);
      return { success: false, error: "Failed to create order. Please try again." };
    }

    // Revalidate dashboard pages to show new order
    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard");

    return {
      success: true,
      orderId: String(orderId),
    };
  } catch (error) {
    console.error("Order creation error:", error);
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

