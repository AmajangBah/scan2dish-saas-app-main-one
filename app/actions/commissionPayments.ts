"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { requireRestaurant } from "@/lib/auth/restaurant";

export type CommissionPaymentReceipt = {
  id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
  receipt_number: string | null;
  receipt_sent_at: string | null;
};

export async function getCommissionPaymentReceipts(): Promise<{
  currency: string;
  total_commission_owed: number;
  total_commission_paid: number;
  last_payment_date: string | null;
  payments: CommissionPaymentReceipt[];
}> {
  const ctx = await requireRestaurant();
  const supabase = await createServerSupabase();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("currency, total_commission_owed, total_commission_paid, last_payment_date")
    .eq("id", ctx.restaurant.id)
    .single();

  const { data: payments } = await supabase
    .from("commission_payments")
    .select(
      "id, amount, payment_method, payment_date, reference_number, notes, receipt_number, receipt_sent_at"
    )
    .eq("restaurant_id", ctx.restaurant.id)
    .order("payment_date", { ascending: false })
    .limit(50);

  return {
    currency: restaurant?.currency || ctx.restaurant.currency || "GMD",
    total_commission_owed: Number(restaurant?.total_commission_owed || 0),
    total_commission_paid: Number(restaurant?.total_commission_paid || 0),
    last_payment_date: restaurant?.last_payment_date ? String(restaurant.last_payment_date) : null,
    payments:
      (payments ?? []).map((p) => ({
        id: String(p.id),
        amount: Number((p as unknown as { amount?: unknown }).amount ?? 0),
        payment_method: String((p as unknown as { payment_method?: unknown }).payment_method ?? ""),
        payment_date: String((p as unknown as { payment_date?: unknown }).payment_date ?? ""),
        reference_number:
          (p as unknown as { reference_number?: unknown }).reference_number != null
            ? String((p as unknown as { reference_number?: unknown }).reference_number)
            : null,
        notes:
          (p as unknown as { notes?: unknown }).notes != null
            ? String((p as unknown as { notes?: unknown }).notes)
            : null,
        receipt_number:
          (p as unknown as { receipt_number?: unknown }).receipt_number != null
            ? String((p as unknown as { receipt_number?: unknown }).receipt_number)
            : null,
        receipt_sent_at:
          (p as unknown as { receipt_sent_at?: unknown }).receipt_sent_at != null
            ? String((p as unknown as { receipt_sent_at?: unknown }).receipt_sent_at)
            : null,
      })) as CommissionPaymentReceipt[],
  };
}

