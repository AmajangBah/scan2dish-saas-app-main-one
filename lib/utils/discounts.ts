import type { Discount } from "@/types/discounts";

export type DiscountComputationInput = {
  subtotal: number;
  items: Array<{
    menu_item_id: string;
    category?: string | null;
    lineSubtotal: number;
  }>;
  discounts: Discount[];
  now?: Date;
};

export type AppliedDiscount = {
  discountId: string;
  discountType: Discount["discount_type"];
  applyTo: Discount["apply_to"];
  amount: number;
};

function isDiscountActiveNow(d: Discount, now: Date) {
  if (!d.is_active) return false;
  const start = d.start_time ? new Date(d.start_time) : null;
  const end = d.end_time ? new Date(d.end_time) : null;
  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * Discount rules (simple + predictable):
 * - Only ONE discount is applied per order: whichever yields the highest savings.
 * - No stacking.
 * - `discount_type === "fixed"` subtracts a fixed amount ONCE from the applicable subtotal.
 * - All other discount types are treated as percentage-off for now.
 * - Scope is driven by `apply_to` (all/category/item).
 */
export function computeBestDiscount(input: DiscountComputationInput): {
  discountAmount: number;
  applied: AppliedDiscount | null;
} {
  const now = input.now ?? new Date();
  const subtotal = Number.isFinite(input.subtotal) ? input.subtotal : 0;
  if (subtotal <= 0) return { discountAmount: 0, applied: null };

  let best: AppliedDiscount | null = null;
  let bestAmount = 0;

  for (const d of input.discounts) {
    if (!isDiscountActiveNow(d, now)) continue;

    const value = Number(d.discount_value ?? 0);
    if (!Number.isFinite(value) || value <= 0) continue;

    // Compute applicable subtotal
    let applicable = 0;

    if (d.apply_to === "all") {
      applicable = subtotal;
    } else if (d.apply_to === "category") {
      const cat = d.category_id ? String(d.category_id) : "";
      if (!cat) continue;
      for (const it of input.items) {
        if (it.category && String(it.category) === cat) {
          applicable += it.lineSubtotal;
        }
      }
    } else if (d.apply_to === "item") {
      const itemId = d.item_id ? String(d.item_id) : "";
      if (!itemId) continue;
      for (const it of input.items) {
        if (String(it.menu_item_id) === itemId) {
          applicable += it.lineSubtotal;
        }
      }
    }

    if (!(applicable > 0)) continue;

    let amount = 0;
    if (d.discount_type === "fixed") {
      amount = Math.min(value, applicable);
    } else {
      // Treat as percentage-off
      amount = (applicable * value) / 100;
      amount = Math.min(amount, applicable);
    }

    amount = round2(amount);
    if (amount <= 0) continue;

    if (amount > bestAmount) {
      bestAmount = amount;
      best = {
        discountId: d.id,
        discountType: d.discount_type,
        applyTo: d.apply_to,
        amount,
      };
    }
  }

  const discountAmount = Math.min(bestAmount, subtotal);
  return { discountAmount, applied: best };
}

