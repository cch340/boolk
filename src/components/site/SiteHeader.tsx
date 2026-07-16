import { getSessionUser } from "@/lib/auth";
import { getCurrency, getLocale } from "@/lib/prefs";
import { HeaderClient } from "./HeaderClient";

export async function SiteHeader() {
  const [user, locale, currency] = await Promise.all([
    getSessionUser(),
    getLocale(),
    getCurrency(),
  ]);
  return <HeaderClient user={user} locale={locale} currency={currency} />;
}
