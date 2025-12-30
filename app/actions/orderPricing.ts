"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { maybeCreateServiceSupabase } from "@/lib/supabase/service";
import { validateTable } from "@/lib/utils/tables";
import { calculateOrderPricing } from "@/lib/utils/pricing";
import { z } from "zod";
import type { Discount } from "@/types/discounts";
import { computeBestDiscount } from "@/lib/utils/discounts";

const PreviewPricingSchema = z.object({
  table_id: z.string().uuid(),
  items: z
    .array(
      z.object({
        id: z.string().uuid(),
        qty: z.number().int().positive(),
      })
    )
    .min(1),
});

export type PreviewOrderPricingInput = z.infer<typeof PreviewPricingSchema>;

export type PreviewOrderPricingResult =
  | {
      success: true;
      subtotal: number;
      discount: number;
      total: number;
    }
  | { success: false; error: string };

/**
 * Pricing preview for customer cart/checkout.
 * Uses DB prices + discount rules server-side for accurate display.
 */
export async function previewOrderPricing(
  input: PreviewOrderPricingInput
): Promise<PreviewOrderPricingResult> {
  try {
    const validated = PreviewPricingSchema.parse(input);
    const supabase = await createServerSupabase();
    const service = maybeCreateServiceSupabase();

    const table = await validateTable(validated.table_id);
    if (!table) return { success: false, error: "Table not found or inactive" };

    const restaurant_id = table.restaurant_id;

    const menuItemIds = validated.items.map((i) => i.id);
    const { data: menuItems, error: menuError } = await supabase
      .from("menu_items")
      .select("id, price, category, available")
      .eq("restaurant_id", restaurant_id)
      .in("id", menuItemIds);

    if (menuError || !menuItems || menuItems.length !== menuItemIds.length) {
      return { success: false, error: "One or more items not found" };
    }

    const unavailable = menuItems.filter((m) => !m.available);
    if (unavailable.length > 0) {
      return { success: false, error: "Some items are unavailable" };
    }

    const map = new Map(menuItems.map((m) => [String(m.id), m]));

    const lines = validated.items.map((i) => {
      const m = map.get(String(i.id));
      if (!m) throw new Error("Item not found");
      const price = Number(m.price ?? 0);
      const qty = i.qty;
      return {
        menu_item_id: String(m.id),
        category: m.category ? String(m.category) : null,
        lineSubtotal: price * qty,
      };
    });

    const subtotal = lines.reduce((s, l) => s + l.lineSubtotal, 0);

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
      items: lines,
      discounts,
    });

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const pricing = calculateOrderPricing(discountedSubtotal);

    return {
      success: true,
      subtotal,
      discount: discountAmount,
      total: pricing.total,
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to preview pricing",
    };
  }
}

