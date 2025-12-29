/**
 * Calculate order pricing server-side
 * VAT rate: 10%
 * Tip rate: 3%
 */
const VAT_RATE = 0.1;
const TIP_RATE = 0.03;
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
  const vat_amount = Math.round(subtotal * VAT_RATE);
  const tip_amount = Math.round(subtotal * TIP_RATE);
  const total = subtotal + vat_amount + tip_amount;
  const commission_amount = Math.round(total * COMMISSION_RATE * 100) / 100; // Round to 2 decimals

  return {
    subtotal,
    vat_amount,
    tip_amount,
    total,
    commission_rate: COMMISSION_RATE,
    commission_amount,
  };
}

