// Multi-currency display layer.
//
// All storage and charging stays in USD integer cents. This module converts a
// USD-cents amount to a display string in a chosen currency using a static
// mid-2026 rates table. It is a pure module — safe to import from both client
// and server components (no next/headers, no fs).

export type CurrencyCode =
  | "USD"
  | "EUR"
  | "GBP"
  | "JPY"
  | "SGD"
  | "THB"
  | "MYR"
  | "IDR";

export interface CurrencyMeta {
  code: CurrencyCode;
  symbol: string;
  label: string;
  /** Units of this currency per 1 USD (static mid-2026 mid-market rates). */
  ratePerUsd: number;
  /** Fraction digits used for display (JPY / IDR have none). */
  decimals: number;
}

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  USD: { code: "USD", symbol: "$", label: "US Dollar", ratePerUsd: 1, decimals: 2 },
  EUR: { code: "EUR", symbol: "€", label: "Euro", ratePerUsd: 0.92, decimals: 2 },
  GBP: { code: "GBP", symbol: "£", label: "British Pound", ratePerUsd: 0.79, decimals: 2 },
  JPY: { code: "JPY", symbol: "¥", label: "Japanese Yen", ratePerUsd: 157, decimals: 0 },
  SGD: { code: "SGD", symbol: "S$", label: "Singapore Dollar", ratePerUsd: 1.35, decimals: 2 },
  THB: { code: "THB", symbol: "฿", label: "Thai Baht", ratePerUsd: 36.5, decimals: 2 },
  MYR: { code: "MYR", symbol: "RM", label: "Malaysian Ringgit", ratePerUsd: 4.7, decimals: 2 },
  IDR: { code: "IDR", symbol: "Rp", label: "Indonesian Rupiah", ratePerUsd: 16250, decimals: 0 },
};

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

/** Type guard: is `value` a supported currency code? */
export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && value in CURRENCIES;
}

/**
 * Convert a USD-cents amount to the target currency's major-unit amount
 * (a plain number, e.g. 123.45 for USD, 18400 for JPY), rounded to that
 * currency's decimals. Suitable for feeding into formatMoney / display.
 */
export function convertFromUsdCents(cents: number, code: CurrencyCode): number {
  const meta = CURRENCIES[code] ?? CURRENCIES[DEFAULT_CURRENCY];
  const usd = cents / 100;
  const converted = usd * meta.ratePerUsd;
  const factor = Math.pow(10, meta.decimals);
  return Math.round(converted * factor) / factor;
}

/**
 * Format a USD-cents amount as a localized display string in the given
 * currency, e.g. formatMoney(12345, "USD") -> "$123.45",
 * formatMoney(12300, "SGD") -> "S$166.05", formatMoney(11700, "JPY") -> "¥18,369".
 */
export function formatMoney(usdCents: number, code: CurrencyCode): string {
  const meta = CURRENCIES[code] ?? CURRENCIES[DEFAULT_CURRENCY];
  const amount = convertFromUsdCents(usdCents, code);
  const number = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  }).format(amount);
  return `${meta.symbol}${number}`;
}
