import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isCurrencyCode } from "@/lib/currency";
import { isLocale } from "@/lib/i18n";
import { CURRENCY_COOKIE, LOCALE_COOKIE } from "@/lib/prefs";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Sets the `currency` and/or `locale` cookies. Cookies are non-httpOnly so the
// header's client component can read the current selection; storage/charging
// stays USD regardless of the display currency.
export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { currency, locale } = (body ?? {}) as {
    currency?: unknown;
    locale?: unknown;
  };

  if (currency !== undefined && !isCurrencyCode(currency)) {
    return NextResponse.json(
      { error: "Unsupported currency" },
      { status: 400 },
    );
  }
  if (locale !== undefined && !isLocale(locale)) {
    return NextResponse.json({ error: "Unsupported locale" }, { status: 400 });
  }

  const store = await cookies();
  const opts = {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  };

  if (isCurrencyCode(currency)) store.set(CURRENCY_COOKIE, currency, opts);
  if (isLocale(locale)) store.set(LOCALE_COOKIE, locale, opts);

  return NextResponse.json({ ok: true });
}
