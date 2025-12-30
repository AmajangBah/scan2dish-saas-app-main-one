"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { createServiceSupabase, maybeCreateServiceSupabase } from "@/lib/supabase/service";
import { signKitchenSession, verifyKitchenPin as verifyPin, isValidKitchenPin, verifyKitchenSession } from "@/lib/utils/kitchenAuth";

function cookieName(restaurantId: string) {
  return `s2d_kitchen_${restaurantId}`;
}

async function getKitchenConfigOrThrow(restaurantId: string) {
  const service = maybeCreateServiceSupabase();
  if (!service) {
    throw new Error(
      "Kitchen mode requires SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)"
    );
  }

  const { data, error } = await service
    .from("restaurants")
    .select("id, name, kitchen_enabled, kitchen_pin_hash")
    .eq("id", restaurantId)
    .single();

  if (error || !data) throw new Error("Restaurant not found");
  return data as {
    id: string;
    name: string;
    kitchen_enabled: boolean;
    kitchen_pin_hash: string | null;
  };
}

async function requireKitchenSession(restaurantId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName(restaurantId))?.value;
  if (!token) throw new Error("Unauthorized");
  if (!verifyKitchenSession(token, restaurantId)) throw new Error("Unauthorized");
}

const VerifyPinSchema = z.object({
  restaurantId: z.string().uuid(),
  pin: z.string(),
});

export async function kitchenVerifyPin(input: z.infer<typeof VerifyPinSchema>) {
  const { restaurantId, pin } = VerifyPinSchema.parse(input);
  const cfg = await getKitchenConfigOrThrow(restaurantId);

  if (!cfg.kitchen_enabled) return { success: false, error: "Kitchen mode is disabled" };
  if (!cfg.kitchen_pin_hash) return { success: true };

  if (!isValidKitchenPin(pin)) return { success: false, error: "Invalid PIN" };
  const ok = verifyPin(pin, cfg.kitchen_pin_hash);
  if (!ok) return { success: false, error: "Incorrect PIN" };

  const issuedAt = Date.now();
  const token = signKitchenSession({ restaurantId, issuedAt });

  const secure = process.env.NODE_ENV === "production";
  const cookieStore = await cookies();
  cookieStore.set(cookieName(restaurantId), token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: `/kitchen/${restaurantId}`,
  });

  return { success: true };
}

export async function kitchenLogout(restaurantId: string) {
  const secure = process.env.NODE_ENV === "production";
  const cookieStore = await cookies();
  cookieStore.set(cookieName(restaurantId), "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: `/kitchen/${restaurantId}`,
    expires: new Date(0),
  });
  return { success: true };
}

export type KitchenOrderStatus = "pending" | "preparing" | "completed";

export type KitchenOrder = {
  id: string;
  table: string;
  status: KitchenOrderStatus;
  createdAt: string;
  minutesAgo: number;
  notes: string | null;
  items: Array<{ name: string; qty: number }>;
};

export type KitchenLowStockIngredient = {
  id: string;
  name: string;
  unit: string;
  current_quantity: number;
  min_threshold: number;
};

export async function kitchenFetchLowStock(
  restaurantId: string
): Promise<KitchenLowStockIngredient[]> {
  const cfg = await getKitchenConfigOrThrow(restaurantId);
  if (!cfg.kitchen_enabled) throw new Error("Kitchen mode is disabled");
  if (cfg.kitchen_pin_hash) await requireKitchenSession(restaurantId);

  const service = createServiceSupabase();
  const { data, error } = await service
    .from("ingredients")
    .select("id, name, unit, current_quantity, min_threshold")
    .eq("restaurant_id", restaurantId);

  // Filter in memory (Supabase JS doesn't support column-to-column compare here).
  if (error) throw new Error("Failed to load low stock");
  const rows = (data ?? []) as unknown as Array<{
    id: string;
    name: string;
    unit: string;
    current_quantity: number | string | null;
    min_threshold: number | string | null;
  }>;

  return rows
    .map((r) => ({
      id: String(r.id),
      name: String(r.name),
      unit: String(r.unit),
      current_quantity: Number(r.current_quantity ?? 0),
      min_threshold: Number(r.min_threshold ?? 0),
    }))
    .filter((r) => r.current_quantity <= r.min_threshold)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function kitchenFetchOrders(restaurantId: string): Promise<KitchenOrder[]> {
  const cfg = await getKitchenConfigOrThrow(restaurantId);
  if (!cfg.kitchen_enabled) throw new Error("Kitchen mode is disabled");
  if (cfg.kitchen_pin_hash) await requireKitchenSession(restaurantId);

  const service = createServiceSupabase();

  const { data, error } = await service
    .from("orders")
    .select(
      `
      id,
      status,
      items,
      notes,
      created_at,
      restaurant_tables!inner(table_number)
    `
    )
    .eq("restaurant_id", restaurantId)
    .in("status", ["pending", "preparing", "completed"])
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error("Failed to load orders");

  type Row = {
    id: string;
    status: KitchenOrderStatus;
    items: unknown;
    notes: string | null;
    created_at: string;
    restaurant_tables:
      | { table_number?: string }
      | { table_number?: string }[]
      | null
      | undefined;
  };

  const rows = (data ?? []) as unknown as Row[];
  const now = Date.now();

  return rows.map((r) => {
    const rt = r.restaurant_tables;
    const tableNumber = Array.isArray(rt) ? rt[0]?.table_number : rt?.table_number;
    const createdAt = String(r.created_at);
    const minutesAgo = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 60000));
    const rawItems = Array.isArray(r.items) ? (r.items as any[]) : [];
    const items = rawItems
      .filter(Boolean)
      .map((it) => ({
        name: String(it.name ?? "Item"),
        qty: Number(it.quantity ?? it.qty ?? 1),
      }))
      .filter((it) => it.qty > 0);

    return {
      id: String(r.id),
      table: tableNumber ? String(tableNumber) : "—",
      status: r.status,
      createdAt,
      minutesAgo,
      notes: r.notes ? String(r.notes) : null,
      items,
    };
  });
}

const UpdateStatusSchema = z.object({
  restaurantId: z.string().uuid(),
  orderId: z.string().uuid(),
  status: z.enum(["pending", "preparing", "completed"]),
});

export async function kitchenUpdateOrderStatus(input: z.infer<typeof UpdateStatusSchema>) {
  const { restaurantId, orderId, status } = UpdateStatusSchema.parse(input);
  const cfg = await getKitchenConfigOrThrow(restaurantId);
  if (!cfg.kitchen_enabled) throw new Error("Kitchen mode is disabled");
  if (cfg.kitchen_pin_hash) await requireKitchenSession(restaurantId);

  const service = createServiceSupabase();

  // Hard limit: status ONLY.
  const { error } = await service
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .eq("restaurant_id", restaurantId);

  if (error) throw new Error("Failed to update status");
  return { success: true };
}

