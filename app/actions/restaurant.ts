"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRestaurantPage } from "@/lib/auth/restaurant";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const UpdateBusinessProfileSchema = z.object({
  name: z.string().min(1, "Restaurant name is required").max(100),
  phone: z
    .string()
    .min(8, "Phone must be at least 8 digits")
    .max(20)
    .optional()
    .nullable(),
  brand_color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Invalid color format")
    .optional(),
  currency: z
    .enum(["USD", "EUR", "GBP", "GMD", "XOF", "NGN", "GHS", "ZAR", "KES"])
    .optional(),
});

const UpdateBrandingSchema = z.object({
  brand_color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
});

// ============================================================================
// TYPES
// ============================================================================

export type UpdateBusinessProfileInput = z.infer<
  typeof UpdateBusinessProfileSchema
>;
export type UpdateBrandingInput = z.infer<typeof UpdateBrandingSchema>;

export interface RestaurantActionResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Update restaurant business profile (name, phone)
 */
export async function updateBusinessProfile(
  input: UpdateBusinessProfileInput,
): Promise<RestaurantActionResult> {
  try {
    const validated = UpdateBusinessProfileSchema.parse(input);
    const ctx = await requireRestaurantPage();
    if (!ctx) {
      return { success: false, error: "Unauthorized" };
    }
    const restaurant_id = ctx.restaurant.id;

    const supabase = await createServerSupabase();

    const updateData: {
      name: string;
      phone?: string | null;
      brand_color?: string;
      currency?: string;
    } = {
      name: validated.name,
    };

    if (validated.phone !== undefined) {
      updateData.phone = validated.phone;
    }

    if (validated.brand_color !== undefined) {
      updateData.brand_color = validated.brand_color;
    }

    if (validated.currency !== undefined) {
      updateData.currency = validated.currency;
    }

    const { data, error } = await supabase
      .from("restaurants")
      .update(updateData)
      .eq("id", restaurant_id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update business profile:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");

    return { success: true, data };
  } catch (error) {
    console.error("Update business profile error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update profile",
    };
  }
}

/**
 * Update restaurant branding (colors)
 */
export async function updateBranding(
  input: UpdateBrandingInput,
): Promise<RestaurantActionResult> {
  try {
    const validated = UpdateBrandingSchema.parse(input);
    const ctx = await requireRestaurantPage();
    if (!ctx) {
      return { success: false, error: "Unauthorized" };
    }
    const restaurant_id = ctx.restaurant.id;

    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("restaurants")
      .update({
        brand_color: validated.brand_color,
      })
      .eq("id", restaurant_id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update branding:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");

    return { success: true, data };
  } catch (error) {
    console.error("Update branding error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update branding",
    };
  }
}

/**
 * Get current restaurant profile
 */
export async function getRestaurantProfile(): Promise<RestaurantActionResult> {
  try {
    const ctx = await requireRestaurantPage();
    if (!ctx) {
      return { success: false, error: "Unauthorized" };
    }
    const restaurant_id = ctx.restaurant.id;
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("restaurants")
      .select("id, name, phone, brand_color, currency, created_at")
      .eq("id", restaurant_id)
      .single();

    if (error) {
      console.error("Failed to get restaurant profile:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        ...data,
        email: user?.email || "",
      },
    };
  } catch (error) {
    console.error("Get restaurant profile error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get profile",
    };
  }
}
