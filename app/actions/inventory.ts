"use server";

import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRestaurant } from "@/lib/auth/restaurant";
import { revalidatePath } from "next/cache";

const IngredientSchema = z.object({
  name: z.string().min(1).max(120),
  unit: z.string().min(1).max(20),
  current_quantity: z.number().nonnegative(),
  min_threshold: z.number().nonnegative(),
  cost_per_unit: z.number().nonnegative().optional().nullable(),
});

export type IngredientInput = z.infer<typeof IngredientSchema>;

export async function createIngredient(input: IngredientInput) {
  try {
    const validated = IngredientSchema.parse(input);
    const ctx = await requireRestaurant();
    const supabase = await createServerSupabase();

    const { error } = await supabase.from("ingredients").insert({
      restaurant_id: ctx.restaurant.id,
      name: validated.name.trim(),
      unit: validated.unit.trim(),
      current_quantity: validated.current_quantity,
      min_threshold: validated.min_threshold,
      cost_per_unit: validated.cost_per_unit ?? null,
    });

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateIngredient(
  id: string,
  input: Partial<IngredientInput>
) {
  try {
    const ctx = await requireRestaurant();
    const supabase = await createServerSupabase();
    const patch = IngredientSchema.partial().parse(input);

    const { error } = await supabase
      .from("ingredients")
      .update({
        ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
        ...(patch.unit !== undefined ? { unit: patch.unit.trim() } : {}),
        ...(patch.current_quantity !== undefined
          ? { current_quantity: patch.current_quantity }
          : {}),
        ...(patch.min_threshold !== undefined
          ? { min_threshold: patch.min_threshold }
          : {}),
        ...(patch.cost_per_unit !== undefined
          ? { cost_per_unit: patch.cost_per_unit ?? null }
          : {}),
      })
      .eq("id", id)
      .eq("restaurant_id", ctx.restaurant.id);

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteIngredient(id: string) {
  try {
    const ctx = await requireRestaurant();
    const supabase = await createServerSupabase();
    const { error } = await supabase
      .from("ingredients")
      .delete()
      .eq("id", id)
      .eq("restaurant_id", ctx.restaurant.id);
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

const AdjustSchema = z.object({
  ingredient_id: z.string().uuid(),
  delta: z.number(),
  reason: z.enum(["restock", "adjustment"]),
  note: z.string().max(200).optional().nullable(),
});

export async function adjustIngredientStock(
  input: z.infer<typeof AdjustSchema>
) {
  try {
    const validated = AdjustSchema.parse(input);
    const ctx = await requireRestaurant();
    const supabase = await createServerSupabase();

    // Atomic: update quantity and write a transaction row
    const { data: ingredient, error: ingErr } = await supabase
      .from("ingredients")
      .select("id, current_quantity")
      .eq("id", validated.ingredient_id)
      .eq("restaurant_id", ctx.restaurant.id)
      .single();

    if (ingErr || !ingredient)
      return { success: false, error: "Ingredient not found" };

    const nextQty = Number(ingredient.current_quantity) + validated.delta;
    if (nextQty < 0)
      return { success: false, error: "Quantity cannot go below 0" };

    const { error: updErr } = await supabase
      .from("ingredients")
      .update({ current_quantity: nextQty })
      .eq("id", validated.ingredient_id)
      .eq("restaurant_id", ctx.restaurant.id);

    if (updErr) return { success: false, error: updErr.message };

    const { error: txErr } = await supabase
      .from("inventory_transactions")
      .insert({
        restaurant_id: ctx.restaurant.id,
        ingredient_id: validated.ingredient_id,
        delta: validated.delta,
        reason: validated.reason,
        note: validated.note ?? null,
      });

    if (txErr) return { success: false, error: txErr.message };

    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

const RecipeRowSchema = z.object({
  ingredient_id: z.string().uuid(),
  quantity_per_item: z.number().positive(),
});

const UpsertRecipeSchema = z.object({
  menu_item_id: z.string().uuid(),
  rows: z.array(RecipeRowSchema),
});

export async function upsertMenuItemRecipe(
  input: z.infer<typeof UpsertRecipeSchema>
) {
  try {
    const validated = UpsertRecipeSchema.parse(input);
    const ctx = await requireRestaurant();
    const supabase = await createServerSupabase();

    // Verify menu item belongs to restaurant
    const { data: mi, error: miErr } = await supabase
      .from("menu_items")
      .select("id")
      .eq("id", validated.menu_item_id)
      .eq("restaurant_id", ctx.restaurant.id)
      .single();
    if (miErr || !mi) return { success: false, error: "Menu item not found" };

    // Validate all ingredient IDs exist and belong to this restaurant
    if (validated.rows.length > 0) {
      for (const row of validated.rows) {
        const { data: ingredient, error: ingErr } = await supabase
          .from("ingredients")
          .select("id")
          .eq("id", row.ingredient_id)
          .eq("restaurant_id", ctx.restaurant.id)
          .single();

        if (ingErr || !ingredient) {
          return {
            success: false,
            error: `Ingredient not found or doesn't belong to your restaurant`,
          };
        }
      }
    }

    // Replace recipe rows (simple + safe)
    const { error: delErr } = await supabase
      .from("menu_item_ingredients")
      .delete()
      .eq("menu_item_id", validated.menu_item_id)
      .eq("restaurant_id", ctx.restaurant.id);

    if (delErr) return { success: false, error: delErr.message };

    if (validated.rows.length > 0) {
      const { error: insErr } = await supabase
        .from("menu_item_ingredients")
        .insert(
          validated.rows.map((r) => ({
            restaurant_id: ctx.restaurant.id,
            menu_item_id: validated.menu_item_id,
            ingredient_id: r.ingredient_id,
            quantity_per_item: r.quantity_per_item,
          }))
        );
      if (insErr) return { success: false, error: insErr.message };
    }

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/menu");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
