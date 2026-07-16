// i18n entry point. Pure module — safe to import from client components.
// Cookie reading lives in `src/lib/prefs.ts` (server-only), never here.

import { en } from "./en";
import { zh } from "./zh";
import { ja } from "./ja";
import type { Messages, MessageKey } from "./keys";

export type { Messages, MessageKey };
export { MESSAGE_KEYS } from "./keys";

export type Locale = "en" | "zh" | "ja";

export const DEFAULT_LOCALE: Locale = "en";

export interface LocaleMeta {
  code: Locale;
  nativeName: string;
  englishName: string;
}

export const LOCALES: LocaleMeta[] = [
  { code: "en", nativeName: "English", englishName: "English" },
  { code: "zh", nativeName: "中文", englishName: "Chinese" },
  { code: "ja", nativeName: "日本語", englishName: "Japanese" },
];

export const LOCALE_CODES = LOCALES.map((l) => l.code);

const DICTIONARIES: Record<Locale, Messages> = { en, zh, ja };

/** Type guard: is `value` a supported locale? */
export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "zh" || value === "ja";
}

/** Returns the message dictionary for a locale (falls back to English). */
export function getDictionary(locale: Locale): Messages {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

type Vars = Record<string, string | number>;

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/**
 * Translate a key against a dictionary, interpolating `{var}` placeholders.
 * Accepts either a dictionary (from getDictionary) or a locale code.
 */
export function t(
  dictOrLocale: Messages | Locale,
  key: MessageKey,
  vars?: Vars,
): string {
  const dict =
    typeof dictOrLocale === "string"
      ? getDictionary(dictOrLocale)
      : dictOrLocale;
  const template = dict[key] ?? en[key] ?? key;
  return interpolate(template, vars);
}
