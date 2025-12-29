"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { requireRestaurant } from "@/lib/auth/restaurant";

export type UsageMetrics = {
  currency: string;
  orders30d: number;
  revenue30d: number;
  commissionOwedTotal: number;
  commissionPaidTotal: number;
  recentOrders: Array<{
    id: string;
    created_at: string;
    total: number;
    status: string;
    table_number: string | null;
  }>;
};

export async function getUsageMetrics(): Promise<UsageMetrics> {
  const ctx = await requireRestaurant();
  const supabase = await createServerSupabase();

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ count: orders30d }, { data: totals }, { data: restaurant }, { data: recent }] =
    await Promise.all([
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", ctx.restaurant.id)
        .gte("created_at", since),
      supabase
        .from("orders")
        .select("total")
        .eq("restaurant_id", ctx.restaurant.id)
        .eq("status", "completed")
        .gte("created_at", since),
      supabase
        .from("restaurants")
        .select("currency, total_commission_owed, total_commission_paid")
        .eq("id", ctx.restaurant.id)
        .single(),
      supabase
        .from("orders")
        .select(
          `
          id,
          created_at,
          total,
          status,
          restaurant_tables(table_number)
        `
        )
        .eq("restaurant_id", ctx.restaurant.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const revenue30d =
    totals?.reduce((sum, o) => sum + Number(o.total || 0), 0) ?? 0;

  const currency = restaurant?.currency || ctx.restaurant.currency || "GMD";
  const commissionOwedTotal = Number(restaurant?.total_commission_owed || 0);
  const commissionPaidTotal = Number(restaurant?.total_commission_paid || 0);

  type RecentOrderRow = {
    id: string;
    created_at: string;
    total: unknown;
    status: unknown;
    restaurant_tables:
      | { table_number?: string }[]
      | { table_number?: string }
      | null
      | undefined;
  };

  const recentOrders = ((recent as unknown as RecentOrderRow[]) || []).map((o) => {
    const rt = o.restaurant_tables;
    const table_number = Array.isArray(rt)
      ? rt[0]?.table_number ?? null
      : rt?.table_number ?? null;

    return {
      id: o.id,
      created_at: o.created_at,
      total: Number(o.total || 0),
      status: String(o.status || ""),
      table_number,
    };
  });

  return {
    currency,
    orders30d: orders30d || 0,
    revenue30d,
    commissionOwedTotal,
    commissionPaidTotal,
    recentOrders,
  };
}

