"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { CURRENCIES, CURRENCY_CODES, type CurrencyCode } from "@/lib/currency";
import {
  LOCALES,
  getDictionary,
  t,
  type Locale,
} from "@/lib/i18n";

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <circle cx={12} cy={12} r={9} />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z" />
    </svg>
  );
}

/**
 * Compact language + currency picker used in both the desktop bar and the
 * mobile menu. POSTs the chosen preference to /api/prefs, then refreshes so
 * server components re-render with the new locale / currency.
 */
export function PrefPicker({
  locale,
  currency,
  variant = "bar",
}: {
  locale: Locale;
  currency: CurrencyCode;
  variant?: "bar" | "menu";
}) {
  const router = useRouter();
  const dict = getDictionary(locale);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function save(body: { locale?: Locale; currency?: CurrencyCode }) {
    await fetch("/api/prefs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    startTransition(() => router.refresh());
  }

  const activeLocale = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  const panel = (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t(dict, "common.language")}
        </p>
        <div className="grid grid-cols-1 gap-1">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              disabled={pending}
              onClick={() => save({ locale: l.code })}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50",
                l.code === locale
                  ? "font-semibold text-brand-700"
                  : "text-slate-700",
              )}
            >
              <span>{l.nativeName}</span>
              <span className="text-xs text-slate-400">{l.englishName}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t(dict, "common.currency")}
        </p>
        <div className="grid grid-cols-2 gap-1">
          {CURRENCY_CODES.map((code) => {
            const meta = CURRENCIES[code];
            return (
              <button
                key={code}
                type="button"
                disabled={pending}
                onClick={() => save({ currency: code })}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50",
                  code === currency
                    ? "font-semibold text-brand-700"
                    : "text-slate-700",
                )}
              >
                <span className="w-6 text-slate-400">{meta.symbol}</span>
                <span>{code}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (variant === "menu") {
    return <div className="px-1">{panel}</div>;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t(dict, "common.language")} / ${t(dict, "common.currency")}`}
        className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <GlobeIcon className="h-4 w-4 text-slate-500" />
        <span className="hidden sm:inline">{activeLocale.nativeName}</span>
        <span className="text-slate-300">·</span>
        <span>{currency}</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-card-hover"
        >
          {panel}
        </div>
      )}
    </div>
  );
}
