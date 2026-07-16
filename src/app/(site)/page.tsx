import Image from "next/image";
import Link from "next/link";
import { listings } from "@/lib/db";
import { getCurrency, getLocale } from "@/lib/prefs";
import { getDictionary, t, type MessageKey } from "@/lib/i18n";
import { ListingCard } from "@/components/site/ListingCard";
import { HomeSearch } from "@/components/site/HomeSearch";
import { DESTINATIONS } from "./_lib/destinations";

const VALUE_PROPS: { title: MessageKey; body: MessageKey; icon: string }[] = [
  {
    title: "home.value.price.title",
    body: "home.value.price.desc",
    icon: "M12 1v22M5 5h9a4 4 0 010 8H7a4 4 0 000 8h10",
  },
  {
    title: "home.value.choice.title",
    body: "home.value.choice.desc",
    icon: "M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.8 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z",
  },
  {
    title: "home.value.trust.title",
    body: "home.value.trust.desc",
    icon: "M9 12l2 2 4-4M12 3a9 9 0 100 18 9 9 0 000-18z",
  },
  {
    title: "home.value.support.title",
    body: "home.value.support.desc",
    icon: "M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0",
  },
];

export default async function HomePage() {
  const [locale, currency] = await Promise.all([getLocale(), getCurrency()]);
  const dict = getDictionary(locale);
  const featured = listings.featured(8);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-700 to-brand-600">
        <div className="absolute inset-0 opacity-20">
          <Image
            src="https://picsum.photos/seed/boolk-hero/1600/900"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-5xl">
            {t(dict, "home.hero.title")}
          </h1>
          <p className="mt-3 max-w-xl text-base text-brand-100 sm:text-lg">
            {t(dict, "home.hero.subtitle")}
          </p>
          <div className="mt-8 max-w-4xl">
            <HomeSearch locale={locale} />
          </div>
        </div>
      </section>

      {/* Featured listings */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {t(dict, "home.featured.title")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t(dict, "home.featured.subtitle")}
            </p>
          </div>
          <Link
            href="/search"
            className="hidden text-sm font-medium text-brand-700 hover:text-brand-800 sm:block"
          >
            {t(dict, "home.viewAll")} →
          </Link>
        </div>
        {featured.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                locale={locale}
                currency={currency}
              />
            ))}
          </div>
        )}
      </section>

      {/* Popular destinations */}
      <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <h2 className="text-2xl font-bold text-slate-900">
          {t(dict, "home.destinations.title")}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {t(dict, "home.destinations.subtitle")}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {DESTINATIONS.map((dest) => (
            <Link
              key={dest.city}
              href={`/search?q=${encodeURIComponent(dest.city)}`}
              className="group relative aspect-[3/4] overflow-hidden rounded-xl"
            >
              <Image
                src={dest.image}
                alt={dest.city}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
              <div className="absolute bottom-0 left-0 p-3">
                <p className="font-semibold text-white">{dest.city}</p>
                <p className="text-xs text-white/80">{dest.country}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:grid-cols-2 lg:grid-cols-4">
          {VALUE_PROPS.map((prop) => (
            <div key={prop.title} className="flex flex-col gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={prop.icon} />
                </svg>
              </span>
              <h3 className="font-semibold text-slate-900">
                {t(dict, prop.title)}
              </h3>
              <p className="text-sm text-slate-500">{t(dict, prop.body)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
