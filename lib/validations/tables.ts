import { z } from "zod";

/**
 * Validation schema for table ID
 * Used to validate table IDs from URL parameters
 */
export const TableIdSchema = z.string().uuid("Invalid table ID format");

/**
 * Validates a table ID parameter
 */
export function validateTableId(tableId: unknown): string {
  return TableIdSchema.parse(tableId);
}

