"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Discount } from "@/types/discounts";
import { requireRestaurant } from "@/lib/auth/restaurant";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateDiscountSchema = z.object({
  discount_type: z.enum(["percentage", "fixed", "category", "item", "time"]),
  discount_value: z.number().positive("Discount value must be positive"),
  apply_to: z.enum(["all", "category", "item"]),
  category_id: z.string().optional().nullable(),
  item_id: z.string().uuid().optional().nullable(),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

// ============================================================================
// TYPES
// ============================================================================

export type CreateDiscountInput = z.infer<typeof CreateDiscountSchema>;

export interface DiscountActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Create a new discount
 */
export async function createDiscount(
  input: CreateDiscountInput
): Promise<DiscountActionResult> {
  try {
    const validated = CreateDiscountSchema.parse(input);
    const ctx = await requireRestaurant();
    const restaurant_id = ctx.restaurant.id;

    const supabase = await createServerSupabase();

    // Validate that category_id exists if apply_to is "category"
    if (validated.apply_to === "category" && validated.category_id) {
      const { count, error: countError } = await supabase
        .from("menu_items")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", restaurant_id)
        .eq("category", validated.category_id);

      if (countError || (count ?? 0) === 0) {
        return {
          success: false,
          error: `Category "${validated.category_id}" not found in your menu`,
        };
      }
    }

    // Validate that item_id exists if apply_to is "item"
    if (validated.apply_to === "item" && validated.item_id) {
      const { data: item, error: itemError } = await supabase
        .from("menu_items")
        .select("id")
        .eq("id", validated.item_id)
        .eq("restaurant_id", restaurant_id)
        .single();

      if (itemError || !item) {
        return {
          success: false,
          error: "Menu item not found in your restaurant",
        };
      }
    }

    const { data, error } = await supabase
      .from("discounts")
      .insert({
        restaurant_id,
        discount_type: validated.discount_type,
        discount_value: validated.discount_value,
        apply_to: validated.apply_to,
        category_id: validated.category_id || null,
        item_id: validated.item_id || null,
        start_time: validated.start_time || null,
        end_time: validated.end_time || null,
        is_active: validated.is_active,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create discount:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/discounts");

    return { success: true, id: data.id };
  } catch (error) {
    console.error("Create discount error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create discount",
    };
  }
}

/**
 * Update an existing discount
 */
export async function updateDiscount(
  id: string,
  input: Partial<CreateDiscountInput>
): Promise<DiscountActionResult> {
  try {
    const ctx = await requireRestaurant();
    const restaurant_id = ctx.restaurant.id;

    const supabase = await createServerSupabase();

    const { error } = await supabase
      .from("discounts")
      .update(input)
      .eq("id", id)
      .eq("restaurant_id", restaurant_id);

    if (error) {
      console.error("Failed to update discount:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/discounts");

    return { success: true, id };
  } catch (error) {
    console.error("Update discount error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update discount",
    };
  }
}

/**
 * Delete a discount
 */
export async function deleteDiscount(
  id: string
): Promise<DiscountActionResult> {
  try {
    const ctx = await requireRestaurant();
    const restaurant_id = ctx.restaurant.id;

    const supabase = await createServerSupabase();

    const { error } = await supabase
      .from("discounts")
      .delete()
      .eq("id", id)
      .eq("restaurant_id", restaurant_id);

    if (error) {
      console.error("Failed to delete discount:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/discounts");

    return { success: true };
  } catch (error) {
    console.error("Delete discount error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete discount",
    };
  }
}

/**
 * Toggle discount active status
 */
export async function toggleDiscountActive(
  id: string,
  is_active: boolean
): Promise<DiscountActionResult> {
  try {
    const ctx = await requireRestaurant();
    const restaurant_id = ctx.restaurant.id;

    const supabase = await createServerSupabase();

    const { error } = await supabase
      .from("discounts")
      .update({ is_active })
      .eq("id", id)
      .eq("restaurant_id", restaurant_id);

    if (error) {
      console.error("Failed to toggle discount:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/discounts");

    return { success: true };
  } catch (error) {
    console.error("Toggle discount error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to toggle discount",
    };
  }
}

/**
 * Get all discounts for the restaurant
 */
export async function getDiscounts(): Promise<Discount[]> {
  try {
    const ctx = await requireRestaurant();
    const restaurant_id = ctx.restaurant.id;

    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("discounts")
      .select("*")
      .eq("restaurant_id", restaurant_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to get discounts:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Get discounts error:", error);
    return [];
  }
}
