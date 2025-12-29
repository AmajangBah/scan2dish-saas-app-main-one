"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRestaurant } from "@/lib/auth/restaurant";

const CreateTableSchema = z.object({
  table_number: z.string().min(1, "Table number is required"),
  capacity: z.number().int().positive("Capacity must be positive"),
  location: z.string().min(1, "Location is required"),
});

const UpdateTableStatusSchema = z.object({
  status: z.enum(["available", "occupied"]),
});

export type CreateTableInput = z.infer<typeof CreateTableSchema>;
export type UpdateTableStatusInput = z.infer<typeof UpdateTableStatusSchema>;

export interface TableActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

/**
 * Create a new table
 */
export async function createTable(input: CreateTableInput): Promise<TableActionResult> {
  try {
    const validated = CreateTableSchema.parse(input);
    const ctx = await requireRestaurant();
    const restaurant_id = ctx.restaurant.id;

    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("restaurant_tables")
      .insert({
        restaurant_id,
        table_number: validated.table_number,
        capacity: validated.capacity,
        location: validated.location,
        is_active: true,
        status: "available",
        qr_assigned: true, // Auto-assign QR on creation
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create table:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/tables");

    return { success: true, id: data.id };
  } catch (error) {
    console.error("Create table error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create table",
    };
  }
}

/**
 * Update table status
 */
export async function updateTableStatus(
  id: string,
  input: UpdateTableStatusInput
): Promise<TableActionResult> {
  try {
    const validated = UpdateTableStatusSchema.parse(input);
    const ctx = await requireRestaurant();
    const restaurant_id = ctx.restaurant.id;

    const supabase = await createServerSupabase();

    const { error } = await supabase
      .from("restaurant_tables")
      .update({ status: validated.status })
      .eq("id", id)
      .eq("restaurant_id", restaurant_id);

    if (error) {
      console.error("Failed to update table status:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/tables");

    return { success: true };
  } catch (error) {
    console.error("Update table status error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update status",
    };
  }
}

/**
 * Delete a table
 */
export async function deleteTable(id: string): Promise<TableActionResult> {
  try {
    const ctx = await requireRestaurant();
    const restaurant_id = ctx.restaurant.id;

    const supabase = await createServerSupabase();

    const { error } = await supabase
      .from("restaurant_tables")
      .delete()
      .eq("id", id)
      .eq("restaurant_id", restaurant_id);

    if (error) {
      console.error("Failed to delete table:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/tables");

    return { success: true };
  } catch (error) {
    console.error("Delete table error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete table",
    };
  }
}

/**
 * Toggle table active status
 */
export async function toggleTableActive(
  id: string,
  is_active: boolean
): Promise<TableActionResult> {
  try {
    const ctx = await requireRestaurant();
    const restaurant_id = ctx.restaurant.id;

    const supabase = await createServerSupabase();

    const { error } = await supabase
      .from("restaurant_tables")
      .update({ is_active })
      .eq("id", id)
      .eq("restaurant_id", restaurant_id);

    if (error) {
      console.error("Failed to toggle table active status:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/tables");

    return { success: true };
  } catch (error) {
    console.error("Toggle active status error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update active status",
    };
  }
}
