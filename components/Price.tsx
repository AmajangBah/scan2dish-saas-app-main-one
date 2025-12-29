"use client";

import { formatPrice } from "@/lib/utils/currency";

interface PriceProps {
  amount: number;
  currency?: string;
  className?: string;
}

/**
 * Price component that formats prices with the correct currency symbol
 * Usage: <Price amount={100} currency="USD" />
 */
export default function Price({ amount, currency = "GMD", className = "" }: PriceProps) {
  return <span className={className}>{formatPrice(amount, currency)}</span>;
}
