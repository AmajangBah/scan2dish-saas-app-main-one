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
 * Format a money amount using Intl.
 *
 * - Uses the currency's preferred locale when none is provided.
 * - Always returns a display-safe, localized currency string.
 */
export function formatPrice(
  amount: number,
  currencyCode: string = DEFAULT_CURRENCY,
  locale?: string
): string {
  const resolvedCurrency = getCurrency(currencyCode).code;
  const resolvedLocale = locale || getCurrency(currencyCode).locale || "en";

  try {
    return new Intl.NumberFormat(resolvedLocale, {
      style: "currency",
      currency: resolvedCurrency,
    }).format(Number.isFinite(amount) ? amount : 0);
  } catch {
    // Fallback: keep UI usable even if Intl rejects a currency/locale combo
    const c = getCurrency(currencyCode);
    const safe = Number.isFinite(amount) ? amount : 0;
    return `${c.symbol} ${safe.toFixed(2)}`;
  }
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

export type FormatMoneyInput = {
  amount: number;
  currency?: string;
  locale?: string;
};

/**
 * Convenience wrapper when your code already uses an object.
 */
export function formatMoney({ amount, currency, locale }: FormatMoneyInput): string {
  return formatPrice(amount, currency || DEFAULT_CURRENCY, locale);
}
