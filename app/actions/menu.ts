"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRestaurant } from "@/lib/auth/restaurant";

const MenuItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().default(""),
  price: z.number().positive("Price must be positive"),
  category: z.string().min(1, "Category is required"),
  images: z.array(z.string()).default([]),
  available: z.boolean().default(true),
  tags: z.object({
    spicy: z.boolean().default(false),
    vegetarian: z.boolean().default(false),
    glutenFree: z.boolean().default(false),
  }).default({ spicy: false, vegetarian: false, glutenFree: false }),
  variants: z.array(z.object({
    label: z.string(),
    price: z.number(),
  })).default([]),
});

export type MenuItemInput = z.infer<typeof MenuItemSchema>;

export interface MenuActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

/**
 * Create a new menu item
 */
export async function createMenuItem(input: MenuItemInput): Promise<MenuActionResult> {
  try {
    const validated = MenuItemSchema.parse(input);
    const ctx = await requireRestaurant();
    const restaurant_id = ctx.restaurant.id;

    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("menu_items")
      .insert({
        restaurant_id,
        name: validated.name,
        description: validated.description,
        price: validated.price,
        category: validated.category,
        images: validated.images,
        available: validated.available,
        tags: validated.tags,
        variants: validated.variants,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create menu item:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/menu");
    revalidatePath("/menu");

    return { success: true, id: data.id };
  } catch (error) {
    console.error("Create menu item error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create menu item",
    };
  }
}

/**
 * Update an existing menu item
 */
export async function updateMenuItem(
  id: string,
  input: Partial<MenuItemInput>
): Promise<MenuActionResult> {
  try {
    const validated = MenuItemSchema.partial().parse(input);
    const ctx = await requireRestaurant();
    const restaurant_id = ctx.restaurant.id;

    const supabase = await createServerSupabase();

    // Build update object with only provided fields
    const updateData: Partial<MenuItemInput> = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.price !== undefined) updateData.price = validated.price;
    if (validated.category !== undefined) updateData.category = validated.category;
    if (validated.images !== undefined) updateData.images = validated.images;
    if (validated.available !== undefined) updateData.available = validated.available;
    if (validated.tags !== undefined) updateData.tags = validated.tags;
    if (validated.variants !== undefined) updateData.variants = validated.variants;

    const { error } = await supabase
      .from("menu_items")
      .update(updateData)
      .eq("id", id)
      .eq("restaurant_id", restaurant_id);

    if (error) {
      console.error("Failed to update menu item:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/menu");
    revalidatePath("/menu");

    return { success: true, id };
  } catch (error) {
    console.error("Update menu item error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update menu item",
    };
  }
}

/**
 * Delete a menu item
 */
export async function deleteMenuItem(id: string): Promise<MenuActionResult> {
  try {
    const ctx = await requireRestaurant();
    const restaurant_id = ctx.restaurant.id;

    const supabase = await createServerSupabase();

    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", id)
      .eq("restaurant_id", restaurant_id);

    if (error) {
      console.error("Failed to delete menu item:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/menu");
    revalidatePath("/menu");

    return { success: true };
  } catch (error) {
    console.error("Delete menu item error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete menu item",
    };
  }
}

/**
 * Toggle menu item availability
 */
export async function toggleMenuItemAvailability(
  id: string,
  available: boolean
): Promise<MenuActionResult> {
  try {
    const ctx = await requireRestaurant();
    const restaurant_id = ctx.restaurant.id;

    const supabase = await createServerSupabase();

    const { error } = await supabase
      .from("menu_items")
      .update({ available })
      .eq("id", id)
      .eq("restaurant_id", restaurant_id);

    if (error) {
      console.error("Failed to toggle availability:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/menu");
    revalidatePath("/menu");

    return { success: true };
  } catch (error) {
    console.error("Toggle availability error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update availability",
    };
  }
}
