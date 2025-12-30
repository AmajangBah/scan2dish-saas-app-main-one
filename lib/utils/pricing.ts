/**
 * Calculate order pricing server-side
 *
 * Note: VAT/tip are intentionally disabled in Scan2Dish ordering flow to avoid
 * confusing customers and to keep menu/cart/checkout totals consistent.
 */
const VAT_RATE = 0;
const TIP_RATE = 0;
const COMMISSION_RATE = 0.05;

export interface OrderPricing {
  subtotal: number;
  vat_amount: number;
  tip_amount: number;
  total: number;
  commission_rate: number;
  commission_amount: number;
}

/**
 * Calculate all order pricing components
 * This ensures prices are calculated server-side, preventing manipulation
 */
export function calculateOrderPricing(subtotal: number): OrderPricing {
  const vat_amount = subtotal * VAT_RATE;
  const tip_amount = subtotal * TIP_RATE;
  const total = subtotal + vat_amount + tip_amount;
  const commission_amount = Math.round(total * COMMISSION_RATE * 100) / 100; // 2dp

  return {
    subtotal,
    vat_amount,
    tip_amount,
    total,
    commission_rate: COMMISSION_RATE,
    commission_amount,
  };
}

