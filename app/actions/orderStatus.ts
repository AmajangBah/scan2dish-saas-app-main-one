"use server";

import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRestaurant } from "@/lib/auth/restaurant";

const UpdateOrderStatusSchema = z.object({
  order_id: z.string().uuid(),
  status: z.enum(["pending", "preparing", "completed", "cancelled"]),
});

export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;

export interface UpdateOrderStatusResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action: update an order's status (owner-only via RLS + restaurant_id check)
 */
export async function updateOrderStatus(
  input: UpdateOrderStatusInput
): Promise<UpdateOrderStatusResult> {
  try {
    const validated = UpdateOrderStatusSchema.parse(input);
    const supabase = await createServerSupabase();

    const ctx = await requireRestaurant();
    const restaurant_id = ctx.restaurant.id;

    const { error } = await supabase
      .from("orders")
      .update({ status: validated.status })
      .eq("id", validated.order_id)
      .eq("restaurant_id", restaurant_id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update order";
    return { success: false, error: message };
  }
}


