"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { nightsBetween } from "@/lib/format";
import { formatMoney, type CurrencyCode } from "@/lib/currency";
import { getDictionary, t, type Locale, type MessageKey } from "@/lib/i18n";
import type { Listing } from "@/lib/types";

function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const inputClass =
  "h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function BookingWidget({
  listing,
  isLoggedIn,
  locale,
  currency,
}: {
  listing: Listing;
  isLoggedIn: boolean;
  locale: Locale;
  currency: CurrencyCode;
}) {
  const router = useRouter();
  const dict = getDictionary(locale);
  const isHotel = listing.type === "hotel";
  const isTransport = listing.type === "transport";

  const [checkIn, setCheckIn] = useState(() => todayISO(1));
  const [checkOut, setCheckOut] = useState(() => todayISO(3));
  const [guests, setGuests] = useState(isTransport ? 1 : 2);
  const [error, setError] = useState<string | null>(null);

  const priceKey: MessageKey =
    listing.unitLabel === "night"
      ? "listing.pricePerNight"
      : "listing.pricePerPerson";

  const { units, unitWord, total, valid } = useMemo(() => {
    if (isHotel) {
      const validDates =
        !!checkIn && !!checkOut && new Date(checkOut) > new Date(checkIn);
      const nights = validDates ? nightsBetween(checkIn, checkOut) : 0;
      return {
        units: nights,
        unitWord: t(dict, nights === 1 ? "common.night" : "common.nights"),
        total: nights * listing.pricePerUnitCents,
        valid: validDates,
      };
    }
    if (isTransport) {
      return {
        units: guests,
        unitWord: t(
          dict,
          guests === 1 ? "transport.passenger" : "transport.passengersLabel",
        ),
        total: guests * listing.pricePerUnitCents,
        valid: !!checkIn && guests >= 1,
      };
    }
    return {
      units: guests,
      unitWord: t(dict, guests === 1 ? "common.person" : "common.people"),
      total: guests * listing.pricePerUnitCents,
      valid: !!checkIn && guests >= 1,
    };
  }, [isHotel, isTransport, checkIn, checkOut, guests, listing.pricePerUnitCents, dict]);

  function book() {
    setError(null);
    if (guests > listing.maxGuests) {
      setError(
        t(dict, isTransport ? "transport.err.maxPassengers" : "listing.err.maxGuests", {
          count: listing.maxGuests,
        }),
      );
      return;
    }
    if (!valid) {
      setError(
        t(dict, isHotel ? "listing.err.dates" : "listing.err.date"),
      );
      return;
    }
    const params = new URLSearchParams();
    params.set("checkIn", checkIn);
    if (isHotel) params.set("checkOut", checkOut);
    params.set("guests", String(guests));
    const target = `/checkout/${listing.id}?${params.toString()}`;
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(target)}`);
      return;
    }
    router.push(target);
  }

  const dateLabel = isHotel
    ? t(dict, "bookings.checkIn")
    : t(dict, "bookings.date");
  const countLabel = isTransport
    ? t(dict, "transport.passengersMax", { count: listing.maxGuests })
    : t(dict, "listing.guestsMax", { count: listing.maxGuests });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="text-2xl font-bold text-slate-900">
        {t(dict, priceKey, {
          price: formatMoney(listing.pricePerUnitCents, currency),
        })}
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            {dateLabel}
          </label>
          <input
            type="date"
            value={checkIn}
            min={todayISO()}
            onChange={(e) => setCheckIn(e.target.value)}
            className={inputClass}
          />
        </div>
        {isHotel && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              {t(dict, "bookings.checkOut")}
            </label>
            <input
              type="date"
              value={checkOut}
              min={checkIn || todayISO()}
              onChange={(e) => setCheckOut(e.target.value)}
              className={inputClass}
            />
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            {countLabel}
          </label>
          <input
            type="number"
            min={1}
            max={listing.maxGuests}
            value={guests}
            onChange={(e) =>
              setGuests(
                Math.min(
                  listing.maxGuests,
                  Math.max(1, Number(e.target.value) || 1),
                ),
              )
            }
            className={inputClass}
          />
        </div>
      </div>

      {valid && (
        <div className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>
              {formatMoney(listing.pricePerUnitCents, currency)} × {units}{" "}
              {unitWord}
            </span>
            <span>{formatMoney(total, currency)}</span>
          </div>
          <div className="flex justify-between pt-1 text-base font-semibold text-slate-900">
            <span>{t(dict, "listing.total")}</span>
            <span>{formatMoney(total, currency)}</span>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <Button fullWidth size="lg" className="mt-4" onClick={book}>
        {t(dict, "listing.bookNow")}
      </Button>
      <p className="mt-2 text-center text-xs text-slate-400">
        {t(dict, "listing.demoNote")}
      </p>
    </div>
  );
}
