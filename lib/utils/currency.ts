/**
 * Currency utilities for multi-currency support
 */

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

/**
 * Supported currencies
 */
export const CURRENCIES: Record<string, Currency> = {
  USD: { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US" },
  EUR: { code: "EUR", symbol: "€", name: "Euro", locale: "fr-FR" },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB" },
  GMD: { code: "GMD", symbol: "D", name: "Gambian Dalasi", locale: "en-GM" },
  XOF: { code: "XOF", symbol: "CFA", name: "West African CFA", locale: "fr-FR" },
  NGN: { code: "NGN", symbol: "₦", name: "Nigerian Naira", locale: "en-NG" },
  GHS: { code: "GHS", symbol: "₵", name: "Ghanaian Cedi", locale: "en-GH" },
  ZAR: { code: "ZAR", symbol: "R", name: "South African Rand", locale: "en-ZA" },
  KES: { code: "KES", symbol: "KSh", name: "Kenyan Shilling", locale: "en-KE" },
};

/**
 * Default currency (Gambian Dalasi for Scan2Dish)
 */
export const DEFAULT_CURRENCY = "GMD";

/**
 * Get currency by code
 */
export function getCurrency(code: string): Currency {
  return CURRENCIES[code] || CURRENCIES[DEFAULT_CURRENCY];
}

/**
 * Format price with currency
 */
export function formatPrice(amount: number, currencyCode: string = DEFAULT_CURRENCY): string {
  const currency = getCurrency(currencyCode);
  
  // For currencies with symbol prefix (USD, EUR, GBP, etc.)
  if (["USD", "EUR", "GBP", "ZAR"].includes(currencyCode)) {
    return `${currency.symbol}${amount.toFixed(2)}`;
  }
  
  // For currencies with symbol suffix (GMD, NGN, etc.)
  return `${currency.symbol}${amount}`;
}

/**
 * Get all currency options for selector
 */
export function getCurrencyOptions(): Array<{ value: string; label: string }> {
  return Object.values(CURRENCIES).map((currency) => ({
    value: currency.code,
    label: `${currency.symbol} ${currency.name} (${currency.code})`,
  }));
}
