import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { bookings, listings, reviews, points } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getBalance, earnedForCents } from "@/lib/points";
import { getCurrency, getLocale } from "@/lib/prefs";
import { getDictionary, t, type MessageKey } from "@/lib/i18n";
import { Button } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/currency";
import {
  BookingsList,
  type BookingView,
} from "@/components/site/BookingsList";
import type { PointsReason } from "@/lib/types";

export const metadata: Metadata = { title: "My bookings" };

const REASON_KEY: Record<PointsReason, MessageKey> = {
  earn: "points.reason.earn",
  redeem: "points.reason.redeem",
  "redeem-refund": "points.reason.redeem-refund",
  "earn-revoke": "points.reason.earn-revoke",
  "admin-adjust": "points.reason.admin-adjust",
};

function isFuture(iso: string): boolean {
  const t = new Date(iso).getTime();
  return Number.isFinite(t) && t >= Date.now();
}

export default async function BookingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/bookings");

  const [locale, currency] = await Promise.all([getLocale(), getCurrency()]);
  const dict = getDictionary(locale);

  const rows = bookings.byUser(user.id);
  const reviewedBookingIds = new Set(
    reviews.byUser(user.id).map((r) => r.bookingId),
  );

  const upcoming: BookingView[] = [];
  const past: BookingView[] = [];

  for (const b of rows) {
    const listing = listings.get(b.listingId);
    const relevantDate = b.checkOut ?? b.checkIn;
    const active = b.status === "pending" || b.status === "confirmed";
    const upcomingTrip = active && isFuture(relevantDate);

    const view: BookingView = {
      id: b.id,
      status: b.status,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      guests: b.guests,
      totalCents: b.totalCents,
      listingTitle: listing?.title ?? "Listing unavailable",
      listingSlug: listing?.slug ?? "",
      listingCity: listing ? `${listing.city}, ${listing.country}` : "",
      listingImage:
        listing?.images[0] ?? "https://picsum.photos/seed/boolk-missing/800/600",
      listingType: listing?.type ?? "hotel",
      cancellable: active && isFuture(relevantDate),
      canReview: b.status === "completed" && !reviewedBookingIds.has(b.id),
      pointsEarned: b.pointsEarned ?? 0,
      pointsRedeemed: b.pointsRedeemed ?? 0,
      discountCents: b.discountCents ?? 0,
      pendingPoints: active ? earnedForCents(b.totalCents) : 0,
      route:
        listing?.type === "transport" && listing.transport
          ? {
              originCode: listing.transport.originCode,
              destinationCode: listing.transport.destinationCode,
              mode: listing.transport.mode,
            }
          : undefined,
    };

    if (upcomingTrip) upcoming.push(view);
    else past.push(view);
  }

  const hasAny = rows.length > 0;

  const balance = getBalance(user.id);
  const ledger = points.byUser(user.id).slice(0, 10);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">
        {t(dict, "bookings.title")}
      </h1>
      <p className="mt-1 text-sm text-slate-500">{t(dict, "bookings.subtitle")}</p>

      {/* Points summary */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">{t(dict, "points.balance")}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {t(dict, "points.balanceValue", { points: balance })}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {t(dict, "points.worth", {
                amount: formatMoney(balance, currency),
              })}
            </p>
          </div>
        </div>
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          {t(dict, "points.explainer")}
        </p>

        <div className="mt-4">
          <h2 className="text-sm font-semibold text-slate-900">
            {t(dict, "points.history")}
          </h2>
          {ledger.length > 0 ? (
            <ul className="mt-2 divide-y divide-slate-100">
              {ledger.map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <div>
                    <span className="font-medium text-slate-700">
                      {t(dict, REASON_KEY[tx.reason])}
                    </span>
                    <span className="ml-2 text-xs text-slate-400">
                      {formatDate(tx.createdAt)}
                    </span>
                  </div>
                  <span
                    className={
                      tx.delta >= 0
                        ? "font-semibold text-emerald-600"
                        : "font-semibold text-slate-600"
                    }
                  >
                    {tx.delta >= 0 ? "+" : ""}
                    {tx.delta}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-400">{t(dict, "points.empty")}</p>
          )}
        </div>
      </section>

      <div className="mt-8">
        {hasAny ? (
          <BookingsList
            upcoming={upcoming}
            past={past}
            locale={locale}
            currency={currency}
          />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <h2 className="font-semibold text-slate-900">
              {t(dict, "bookings.empty.title")}
            </h2>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {t(dict, "bookings.empty.desc")}
            </p>
            <Link href="/search" className="mt-4">
              <Button>{t(dict, "bookings.exploreListings")}</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
