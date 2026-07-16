import Link from "next/link";
import { getLocale } from "@/lib/prefs";
import { getDictionary, t, type MessageKey } from "@/lib/i18n";

const COLUMNS: { title: MessageKey; links: { label: MessageKey; href: string }[] }[] = [
  {
    title: "footer.explore",
    links: [
      { label: "nav.hotels", href: "/search?type=hotel" },
      { label: "nav.activities", href: "/search?type=activity" },
      { label: "nav.transport", href: "/search?type=transport" },
      { label: "footer.allListings", href: "/search" },
    ],
  },
  {
    title: "footer.company",
    links: [
      { label: "footer.about", href: "/" },
      { label: "footer.careers", href: "/" },
      { label: "footer.press", href: "/" },
    ],
  },
  {
    title: "footer.support",
    links: [
      { label: "footer.help", href: "/" },
      { label: "footer.cancellation", href: "/" },
      { label: "footer.contact", href: "/" },
    ],
  },
];

export async function SiteFooter() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white">
                B
              </span>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Boolk
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-slate-500">
              {t(dict, "common.tagline")}
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-slate-900">
                {t(dict, col.title)}
              </h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-500 hover:text-slate-900"
                    >
                      {t(dict, link.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-slate-200 pt-6 text-sm text-slate-400 sm:flex-row">
          <p>{t(dict, "footer.rights", { year })}</p>
          <p>{t(dict, "footer.pricesNote")}</p>
        </div>
      </div>
    </footer>
  );
}
