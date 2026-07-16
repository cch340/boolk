import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listings, reviews, users } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getCurrency, getLocale } from "@/lib/prefs";
import { getDictionary, t, type MessageKey } from "@/lib/i18n";
import { Badge, Card, StarRating } from "@/components/ui";
import { Gallery } from "@/components/site/Gallery";
import { BookingWidget } from "@/components/site/BookingWidget";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/currency";
import type { TransportInfo, TransportMode } from "@/lib/types";

const MODE_KEY: Record<TransportMode, MessageKey> = {
  flight: "transport.mode.flight",
  train: "transport.mode.train",
  bus: "transport.mode.bus",
  ferry: "transport.mode.ferry",
  transfer: "transport.mode.transfer",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = listings.findBySlug(slug);
  return { title: listing ? listing.title : "Listing" };
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const listing = listings.findBySlug(slug);
  if (!listing || !listing.active) notFound();

  const [user, locale, currency] = await Promise.all([
    getSessionUser(),
    getLocale(),
    getCurrency(),
  ]);
  const dict = getDictionary(locale);
  const listingReviews = reviews.byListing(listing.id, { visibleOnly: true });

  const reviewsWithNames = listingReviews.map((r) => ({
    ...r,
    authorName: users.get(r.userId)?.name ?? "Boolk guest",
  }));

  const highlights = listing.highlights;
  const facts = listing.amenities;
  const isTransport = listing.type === "transport" && !!listing.transport;
  const priceKey: MessageKey =
    listing.unitLabel === "night"
      ? "listing.pricePerNight"
      : "listing.pricePerPerson";

  function durationLabel(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return t(dict, "transport.durationValue", { hours: h, minutes: m });
  }

  function RouteSummary({ info }: { info: TransportInfo }) {
    return (
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">
          {t(dict, "transport.summary")}
        </h2>
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{info.originCode}</p>
              <p className="text-sm text-slate-500">{info.originCity}</p>
              <p className="mt-1 text-sm font-medium text-slate-700">
                {info.departureTime}
              </p>
            </div>
            <div className="flex flex-1 flex-col items-center px-2">
              <span className="text-xs text-slate-400">
                {durationLabel(info.durationMinutes)}
              </span>
              <div className="my-1 h-px w-full bg-slate-200" />
              <Badge tone="info">{t(dict, MODE_KEY[info.mode])}</Badge>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">
                {info.destinationCode}
              </p>
              <p className="text-sm text-slate-500">{info.destinationCity}</p>
              <p className="mt-1 text-sm font-medium text-slate-700">
                {info.arrivalTime}
              </p>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-slate-400">{t(dict, "transport.carrier")}</dt>
              <dd className="font-medium text-slate-800">{info.carrier}</dd>
            </div>
            <div>
              <dt className="text-slate-400">{t(dict, "transport.service")}</dt>
              <dd className="font-medium text-slate-800">{info.serviceCode}</dd>
            </div>
            <div>
              <dt className="text-slate-400">{t(dict, "transport.depart")}</dt>
              <dd className="font-medium text-slate-800">{info.departureTime}</dd>
            </div>
            <div>
              <dt className="text-slate-400">{t(dict, "transport.arrive")}</dt>
              <dd className="font-medium text-slate-800">{info.arrivalTime}</dd>
            </div>
          </dl>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12">
      {/* Header */}
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {isTransport && listing.transport ? (
            <Badge tone="info">
              {t(dict, MODE_KEY[listing.transport.mode])}
            </Badge>
          ) : (
            <Badge tone={listing.type === "hotel" ? "brand" : "info"}>
              {t(
                dict,
                listing.type === "hotel"
                  ? "listing.type.hotel"
                  : "listing.type.activity",
              )}
            </Badge>
          )}
          {listing.featured && (
            <Badge tone="warning">{t(dict, "common.featured")}</Badge>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          {listing.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
          <span>
            {listing.city}, {listing.country}
          </span>
          <StarRating
            value={listing.rating}
            size="sm"
            showValue
            reviewCount={listing.reviewCount}
          />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left column */}
        <div>
          <Gallery images={listing.images} title={listing.title} />

          {isTransport && listing.transport && (
            <RouteSummary info={listing.transport} />
          )}

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">
              {t(dict, "listing.overview")}
            </h2>
            <p className="mt-2 leading-relaxed text-slate-600">
              {listing.description}
            </p>
          </section>

          {highlights.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-slate-900">
                {t(dict, "listing.highlights")}
              </h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {highlights.map((h) => (
                  <li
                    key={h}
                    className="flex items-start gap-2 text-sm text-slate-600"
                  >
                    <span className="mt-0.5 text-brand-600">✓</span>
                    {h}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!isTransport && facts.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-slate-900">
                {t(
                  dict,
                  listing.type === "hotel"
                    ? "listing.amenities"
                    : "listing.included",
                )}
              </h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {facts.map((a) => (
                  <li
                    key={a}
                    className="flex items-start gap-2 text-sm text-slate-600"
                  >
                    <span className="mt-0.5 text-brand-600">✓</span>
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Reviews */}
          <section className="mt-10">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                {t(dict, "listing.reviews")}
              </h2>
              <StarRating value={listing.rating} size="sm" showValue />
              <span className="text-sm text-slate-400">
                {t(dict, "listing.reviewsTotalShort", {
                  count: listing.reviewCount,
                })}
              </span>
            </div>
            {reviewsWithNames.length > 0 ? (
              <div className="mt-4 space-y-4">
                {reviewsWithNames.map((r) => (
                  <Card key={r.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                          {r.authorName.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {r.authorName}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatDate(r.createdAt)}
                          </p>
                        </div>
                      </div>
                      <StarRating value={r.rating} size="sm" />
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      {r.text}
                    </p>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                {t(dict, "listing.noReviews")}
              </p>
            )}
          </section>

          {/* Mobile inline booking widget */}
          <section id="book" className="mt-10 scroll-mt-20 lg:hidden">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              {t(dict, "listing.reserve")}
            </h2>
            <BookingWidget
              listing={listing}
              isLoggedIn={!!user}
              locale={locale}
              currency={currency}
            />
          </section>
        </div>

        {/* Desktop sticky widget */}
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <BookingWidget
              listing={listing}
              isLoggedIn={!!user}
              locale={locale}
              currency={currency}
            />
          </div>
        </aside>
      </div>

      {/* Mobile fixed bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="text-sm font-bold text-slate-900">
            {t(dict, priceKey, {
              price: formatMoney(listing.pricePerUnitCents, currency),
            })}
          </div>
          <a
            href="#book"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-medium text-white hover:bg-brand-700"
          >
            {t(dict, "listing.reserve")}
          </a>
        </div>
      </div>
    </div>
  );
}
