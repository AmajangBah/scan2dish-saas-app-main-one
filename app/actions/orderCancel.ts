"use server";

import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

const CancelSchema = z.object({
  order_id: z.string().uuid(),
});

export async function cancelOrder(input: z.infer<typeof CancelSchema>) {
  const validated = CancelSchema.parse(input);
  const supabase = await createServerSupabase();

  const { error } = await supabase.rpc("cancel_order_atomic", {
    p_order_id: validated.order_id,
  });

  if (error) {
    const msg = error.message || "Failed to cancel order";
    if (msg.includes("CANNOT_CANCEL_COMPLETED")) {
      return { success: false, error: "Completed orders cannot be cancelled." };
    }
    if (msg.includes("UNAUTHORIZED")) {
      return { success: false, error: "Unauthorized" };
    }
    if (msg.includes("ORDER_NOT_FOUND")) {
      return { success: false, error: "Order not found" };
    }
    return { success: false, error: "Failed to cancel order" };
  }

  return { success: true };
}

