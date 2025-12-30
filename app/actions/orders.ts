"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { validateTable, getRestaurantIdFromTable } from "@/lib/utils/tables";
import { calculateOrderPricing } from "@/lib/utils/pricing";
import { CreateOrderSchema, type CreateOrderInput } from "@/lib/validations/orders";
import { revalidatePath } from "next/cache";
import { maybeCreateServiceSupabase } from "@/lib/supabase/service";
import type { Discount } from "@/types/discounts";
import { computeBestDiscount } from "@/lib/utils/discounts";

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
 * 2. Validates menu items exist and fetches current prices from database
 * 3. Calculates totals server-side (prevents price manipulation)
 * 4. Calculates commission (5% of total)
 * 5. Inserts order with correct restaurant_id
 * 6. Returns order ID
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
    const service = maybeCreateServiceSupabase();

    // 2. Validate table exists and is active
    const table = await validateTable(validatedInput.table_id);
    if (!table) {
      return {
        success: false,
        error: "Table not found or inactive",
      };
    }

    const restaurant_id = table.restaurant_id;

    // 3. Validate menu items exist and fetch current prices
    // This ensures we use database prices, not client-provided prices
    const menuItemIds = validatedInput.items.map((item) => item.id);
    
    const { data: menuItems, error: menuError } = await supabase
      .from("menu_items")
      .select("id, name, price, available, category")
      .eq("restaurant_id", restaurant_id)
      .in("id", menuItemIds);

    if (menuError || !menuItems || menuItems.length !== menuItemIds.length) {
      return {
        success: false,
        error: "One or more menu items not found",
      };
    }

    // Check if all items are available
    const unavailableItems = menuItems.filter((item) => !item.available);
    if (unavailableItems.length > 0) {
      return {
        success: false,
        error: "Some menu items are currently unavailable",
      };
    }

    // 4. Match client items with database items and validate prices
    // Create a map for quick lookup
    const menuItemMap = new Map(menuItems.map((item) => [item.id, item]));
    
    const validatedItems = validatedInput.items.map((clientItem) => {
      const dbItem = menuItemMap.get(clientItem.id);
      if (!dbItem) {
        throw new Error(`Menu item ${clientItem.id} not found`);
      }

      // Use database price, not client-provided price
      // This prevents price manipulation attacks
      return {
        menu_item_id: dbItem.id,
        name: dbItem.name,
        price: dbItem.price,
        quantity: clientItem.qty,
        category: dbItem.category ?? null,
      };
    });

    // 5. Calculate subtotal using validated database prices
    const subtotal = validatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 6. Load discounts (service role; discounts are owner-only under RLS)
    const discountsClient = service ?? supabase;

    const { data: discountsRaw, error: discountsError } = await discountsClient
      .from("discounts")
      .select(
        "id, restaurant_id, discount_type, discount_value, apply_to, category_id, item_id, start_time, end_time, is_active"
      )
      .eq("restaurant_id", restaurant_id)
      .eq("is_active", true);

    if (discountsError) {
      console.error("Failed to load discounts:", discountsError);
    }

    const discounts = (discountsRaw ?? []) as unknown as Discount[];

    const { discountAmount } = computeBestDiscount({
      subtotal,
      items: validatedItems.map((it) => ({
        menu_item_id: String(it.menu_item_id),
        category: it.category ? String(it.category) : null,
        lineSubtotal: Number(it.price) * Number(it.quantity),
      })),
      discounts,
    });

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);

    // 7. Calculate pricing (VAT/tip disabled; commission computed on discounted total)
    const pricing = calculateOrderPricing(discountedSubtotal);

    // 8. Insert order into database
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        restaurant_id,
        table_id: validatedInput.table_id,
        items: validatedItems, // Store as JSONB array (unit prices from DB)
        subtotal, // original subtotal (pre-discount) for transparency
        vat_amount: pricing.vat_amount,
        tip_amount: pricing.tip_amount,
        total: pricing.total,
        commission_rate: pricing.commission_rate,
        commission_amount: pricing.commission_amount,
        status: "pending",
        customer_name: validatedInput.customer_name || null,
        notes: validatedInput.notes || null,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Order creation error:", orderError);
      return {
        success: false,
        error: "Failed to create order. Please try again.",
      };
    }

    // Revalidate dashboard pages to show new order
    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard");

    return {
      success: true,
      orderId: order.id,
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

