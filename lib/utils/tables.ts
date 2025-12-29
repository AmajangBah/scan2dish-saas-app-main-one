import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Validates that a table exists and is active
 * Returns the table data if valid, null otherwise
 */
export async function validateTable(tableId: string) {
  const supabase = await createServerSupabase();

  const { data: table, error } = await supabase
    .from("restaurant_tables")
    .select("id, restaurant_id, is_active, table_number")
    .eq("id", tableId)
    .eq("is_active", true)
    .single();

  if (error || !table) {
    return null;
  }

  return table;
}

/**
 * Gets restaurant ID from a table ID
 */
export async function getRestaurantIdFromTable(tableId: string) {
  const table = await validateTable(tableId);
  return table?.restaurant_id || null;
}

