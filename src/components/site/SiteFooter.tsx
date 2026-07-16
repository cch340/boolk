import Link from "next/link";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { label: "Hotels", href: "/search?type=hotel" },
      { label: "Activities", href: "/search?type=activity" },
      { label: "All listings", href: "/search" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Boolk", href: "/" },
      { label: "Careers", href: "/" },
      { label: "Press", href: "/" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help center", href: "/" },
      { label: "Cancellation", href: "/" },
      { label: "Contact us", href: "/" },
    ],
  },
];

export function SiteFooter() {
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
              Book hotels and unforgettable experiences across the world&apos;s
              best destinations.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-slate-900">
                {col.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-500 hover:text-slate-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-slate-200 pt-6 text-sm text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Boolk. Demo project.</p>
          <p>Prices in USD. No real charges are made.</p>
        </div>
      </div>
    </footer>
  );
}
