import { z } from "zod";

/**
 * Validation schema for order items
 */
export const OrderItemSchema = z.object({
  id: z.string().uuid("Invalid menu item ID"),
  name: z.string().min(1, "Item name is required"),
  price: z.number().positive("Price must be positive"),
  qty: z.number().int().positive("Quantity must be a positive integer"),
  image: z.string().url().optional().nullable(),
});

/**
 * Validation schema for creating an order
 * Used server-side to validate customer order submissions
 */
export const CreateOrderSchema = z.object({
  table_id: z.string().uuid("Invalid table ID"),
  items: z
    .array(OrderItemSchema)
    .min(1, "Order must contain at least one item"),
  customer_name: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type OrderItemInput = z.infer<typeof OrderItemSchema>;

