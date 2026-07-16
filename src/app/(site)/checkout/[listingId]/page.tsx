import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { listings } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getBalance, maxRedeemablePoints } from "@/lib/points";
import { getCurrency, getLocale } from "@/lib/prefs";
import { getDictionary, t, type MessageKey } from "@/lib/i18n";
import { CheckoutForm } from "@/components/site/CheckoutForm";
import { formatDate, nightsBetween } from "@/lib/format";
import { formatMoney } from "@/lib/currency";
import type { TransportMode } from "@/lib/types";
import type { RawParams } from "../../_lib/search-params";

export const metadata: Metadata = { title: "Checkout" };

const MODE_KEY: Record<TransportMode, MessageKey> = {
  flight: "transport.mode.flight",
  train: "transport.mode.train",
  bus: "transport.mode.bus",
  ferry: "transport.mode.ferry",
  transfer: "transport.mode.transfer",
};

function str(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function isValidDate(value: string): boolean {
  return value !== "" && !Number.isNaN(new Date(value).getTime());
}

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ listingId: string }>;
  searchParams: Promise<RawParams>;
}) {
  const { listingId } = await params;
  const sp = await searchParams;

  const listing = listings.get(listingId);
  if (!listing || !listing.active) notFound();

  const isHotel = listing.type === "hotel";
  const isTransport = listing.type === "transport";
  const checkIn = str(sp.checkIn);
  const checkOut = str(sp.checkOut);
  const guests = Math.max(1, Number(str(sp.guests)) || 1);

  const selectionValid =
    isValidDate(checkIn) &&
    (!isHotel || (isValidDate(checkOut) && new Date(checkOut) > new Date(checkIn)));
  if (!selectionValid) {
    redirect(`/listing/${listing.slug}`);
  }

  const user = await getSessionUser();
  if (!user) {
    const backParams = new URLSearchParams();
    backParams.set("checkIn", checkIn);
    if (isHotel) backParams.set("checkOut", checkOut);
    backParams.set("guests", String(guests));
    const next = `/checkout/${listing.id}?${backParams.toString()}`;
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const [locale, currency] = await Promise.all([getLocale(), getCurrency()]);
  const dict = getDictionary(locale);

  const nights = isHotel ? nightsBetween(checkIn, checkOut) : 1;
  const units = isHotel ? nights : guests;
  const totalCents = units * listing.pricePerUnitCents;

  const pointsBalance = getBalance(user.id);
  const maxRedeem = maxRedeemablePoints(user.id, totalCents);

  const unitWord = isHotel
    ? t(dict, nights === 1 ? "common.night" : "common.nights")
    : isTransport
      ? t(dict, guests === 1 ? "transport.passenger" : "transport.passengersLabel")
      : t(dict, guests === 1 ? "common.person" : "common.people");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href={`/listing/${listing.slug}`}
        className="text-sm font-medium text-brand-700 hover:text-brand-800"
      >
        ← {t(dict, "checkout.backToListing")}
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">
        {t(dict, "checkout.confirmPay")}
      </h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="order-2 lg:order-1">
          <CheckoutForm
            listingId={listing.id}
            checkIn={checkIn}
            checkOut={isHotel ? checkOut : undefined}
            guests={guests}
            totalCents={totalCents}
            defaultName={user.name}
            defaultEmail={user.email}
            currency={currency}
            locale={locale}
            pointsBalance={pointsBalance}
            maxRedeemablePoints={maxRedeem}
          />
        </div>

        {/* Summary */}
        <aside className="order-1 lg:order-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card lg:sticky lg:top-20">
            <div className="flex gap-3">
              <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                <Image
                  src={listing.images[0]}
                  alt={listing.title}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">
                  {listing.title}
                </h2>
                {isTransport && listing.transport ? (
                  <p className="text-sm text-slate-500">
                    {listing.transport.originCode} → {listing.transport.destinationCode}
                    {" · "}
                    {t(dict, MODE_KEY[listing.transport.mode])}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">
                    {listing.city}, {listing.country}
                  </p>
                )}
              </div>
            </div>

            <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
              {isHotel ? (
                <>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">
                      {t(dict, "bookings.checkIn")}
                    </dt>
                    <dd className="text-slate-900">{formatDate(checkIn)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">
                      {t(dict, "bookings.checkOut")}
                    </dt>
                    <dd className="text-slate-900">{formatDate(checkOut)}</dd>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <dt className="text-slate-500">{t(dict, "bookings.date")}</dt>
                  <dd className="text-slate-900">{formatDate(checkIn)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate-500">
                  {isTransport
                    ? t(dict, "transport.passengers")
                    : t(dict, "bookings.guests")}
                </dt>
                <dd className="text-slate-900">{guests}</dd>
              </div>
            </dl>

            <div className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>
                  {formatMoney(listing.pricePerUnitCents, currency)} × {units}{" "}
                  {unitWord}
                </span>
                <span>{formatMoney(totalCents, currency)}</span>
              </div>
              <div className="flex justify-between pt-1 text-base font-semibold text-slate-900">
                <span>{t(dict, "checkout.gross")}</span>
                <span>{formatMoney(totalCents, currency)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
