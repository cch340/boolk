// Server-only preference accessors. Reads the `currency` and `locale` cookies
// set by POST /api/prefs. Keep all cookie reads here so the currency and i18n
// modules stay pure and client-safe.

import { cookies } from "next/headers";
import {
  isCurrencyCode,
  DEFAULT_CURRENCY,
  type CurrencyCode,
} from "@/lib/currency";
import { isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

export const CURRENCY_COOKIE = "currency";
export const LOCALE_COOKIE = "locale";

/** Reads the active display currency from the `currency` cookie. */
export async function getCurrency(): Promise<CurrencyCode> {
  const store = await cookies();
  const value = store.get(CURRENCY_COOKIE)?.value;
  return isCurrencyCode(value) ? value : DEFAULT_CURRENCY;
}

/** Reads the active locale from the `locale` cookie. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
