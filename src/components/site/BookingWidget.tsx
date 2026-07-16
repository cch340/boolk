"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { formatPrice, nightsBetween } from "@/lib/format";
import type { Listing } from "@/lib/types";

function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function BookingWidget({
  listing,
  isLoggedIn,
}: {
  listing: Listing;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const isHotel = listing.type === "hotel";

  const [checkIn, setCheckIn] = useState(() => todayISO(1));
  const [checkOut, setCheckOut] = useState(() => todayISO(3));
  const [guests, setGuests] = useState(2);
  const [error, setError] = useState<string | null>(null);

  const { units, unitWord, total, valid } = useMemo(() => {
    if (isHotel) {
      const validDates =
        !!checkIn && !!checkOut && new Date(checkOut) > new Date(checkIn);
      const nights = validDates ? nightsBetween(checkIn, checkOut) : 0;
      return {
        units: nights,
        unitWord: nights === 1 ? "night" : "nights",
        total: nights * listing.pricePerUnitCents,
        valid: validDates,
      };
    }
    return {
      units: guests,
      unitWord: guests === 1 ? "person" : "people",
      total: guests * listing.pricePerUnitCents,
      valid: !!checkIn && guests >= 1,
    };
  }, [isHotel, checkIn, checkOut, guests, listing.pricePerUnitCents]);

  function book() {
    setError(null);
    if (guests > listing.maxGuests) {
      setError(`This listing allows at most ${listing.maxGuests} guests.`);
      return;
    }
    if (!valid) {
      setError(
        isHotel
          ? "Please choose a valid check-in and check-out date."
          : "Please choose a date.",
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

  const inputClass =
    "h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-slate-900">
          {formatPrice(listing.pricePerUnitCents)}
        </span>
        <span className="text-sm text-slate-500">
          / {listing.unitLabel === "night" ? "night" : "person"}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            {isHotel ? "Check in" : "Date"}
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
              Check out
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
            Guests (max {listing.maxGuests})
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
              {formatPrice(listing.pricePerUnitCents)} × {units} {unitWord}
            </span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="flex justify-between pt-1 text-base font-semibold text-slate-900">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <Button fullWidth size="lg" className="mt-4" onClick={book}>
        Book now
      </Button>
      <p className="mt-2 text-center text-xs text-slate-400">
        You won&apos;t be charged yet — demo checkout.
      </p>
    </div>
  );
}
