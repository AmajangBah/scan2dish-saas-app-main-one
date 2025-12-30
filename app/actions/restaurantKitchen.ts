"use server";

import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRestaurant } from "@/lib/auth/restaurant";
import { revalidatePath } from "next/cache";
import { hashKitchenPin, isValidKitchenPin } from "@/lib/utils/kitchenAuth";

const UpdateKitchenSchema = z.object({
  kitchen_enabled: z.boolean(),
  pin: z.string().optional().nullable(),
});

export type UpdateKitchenInput = z.infer<typeof UpdateKitchenSchema>;

export async function updateKitchenSettings(input: UpdateKitchenInput) {
  try {
    const validated = UpdateKitchenSchema.parse(input);
    const ctx = await requireRestaurant();
    const restaurant_id = ctx.restaurant.id;

    const supabase = await createServerSupabase();

    let kitchen_pin_hash: string | null | undefined = undefined;
    const pin = typeof validated.pin === "string" ? validated.pin.trim() : validated.pin;

    if (pin === null || pin === "") {
      kitchen_pin_hash = null;
    } else if (typeof pin === "string") {
      if (!isValidKitchenPin(pin)) {
        return { success: false, error: "PIN must be 4–8 digits" };
      }
      kitchen_pin_hash = hashKitchenPin(pin);
    }

    const update: Record<string, unknown> = {
      kitchen_enabled: validated.kitchen_enabled,
    };
    if (kitchen_pin_hash !== undefined) {
      update.kitchen_pin_hash = kitchen_pin_hash;
    }

    const { error } = await supabase
      .from("restaurants")
      .update(update)
      .eq("id", restaurant_id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function getKitchenSettings() {
  const ctx = await requireRestaurant();
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, kitchen_enabled, kitchen_pin_hash")
    .eq("id", ctx.restaurant.id)
    .single();

  if (error || !data) return { success: false, error: "Failed to load" };
  const row = data as unknown as {
    id: unknown;
    kitchen_enabled?: unknown;
    kitchen_pin_hash?: unknown;
  };
  return {
    success: true,
    data: {
      restaurantId: String(row.id),
      kitchenEnabled: Boolean(row.kitchen_enabled),
      pinEnabled: Boolean(row.kitchen_pin_hash),
    },
  };
}

