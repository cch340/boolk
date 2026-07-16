import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { listings } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { CheckoutForm } from "@/components/site/CheckoutForm";
import { formatDate, formatPrice, nightsBetween } from "@/lib/format";
import type { RawParams } from "../../_lib/search-params";

export const metadata: Metadata = { title: "Checkout" };

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
  const checkIn = str(sp.checkIn);
  const checkOut = str(sp.checkOut);
  const guests = Math.max(1, Number(str(sp.guests)) || 1);

  // Require a valid selection to reach checkout.
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

  const nights = isHotel ? nightsBetween(checkIn, checkOut) : 1;
  const units = isHotel ? nights : guests;
  const totalCents = units * listing.pricePerUnitCents;
  const unitWord = isHotel
    ? nights === 1
      ? "night"
      : "nights"
    : guests === 1
      ? "person"
      : "people";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href={`/listing/${listing.slug}`}
        className="text-sm font-medium text-brand-700 hover:text-brand-800"
      >
        ← Back to listing
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">Confirm & pay</h1>

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
                <p className="text-sm text-slate-500">
                  {listing.city}, {listing.country}
                </p>
              </div>
            </div>

            <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
              {isHotel ? (
                <>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Check in</dt>
                    <dd className="text-slate-900">{formatDate(checkIn)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Check out</dt>
                    <dd className="text-slate-900">{formatDate(checkOut)}</dd>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Date</dt>
                  <dd className="text-slate-900">{formatDate(checkIn)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate-500">Guests</dt>
                <dd className="text-slate-900">{guests}</dd>
              </div>
            </dl>

            <div className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>
                  {formatPrice(listing.pricePerUnitCents)} × {units} {unitWord}
                </span>
                <span>{formatPrice(totalCents)}</span>
              </div>
              <div className="flex justify-between pt-1 text-base font-semibold text-slate-900">
                <span>Total</span>
                <span>{formatPrice(totalCents)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
