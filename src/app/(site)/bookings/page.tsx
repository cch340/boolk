import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { bookings, listings, reviews } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui";
import {
  BookingsList,
  type BookingView,
} from "@/components/site/BookingsList";

export const metadata: Metadata = { title: "My bookings" };

function isFuture(iso: string): boolean {
  const t = new Date(iso).getTime();
  return Number.isFinite(t) && t >= Date.now();
}

export default async function BookingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/bookings");

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
      listingCity: listing
        ? `${listing.city}, ${listing.country}`
        : "",
      listingImage:
        listing?.images[0] ?? "https://picsum.photos/seed/boolk-missing/800/600",
      listingType: listing?.type ?? "hotel",
      cancellable: active && isFuture(relevantDate),
      canReview: b.status === "completed" && !reviewedBookingIds.has(b.id),
    };

    if (upcomingTrip) upcoming.push(view);
    else past.push(view);
  }

  const hasAny = rows.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">My bookings</h1>
      <p className="mt-1 text-sm text-slate-500">
        Manage your trips, cancel reservations, and review completed stays.
      </p>

      <div className="mt-8">
        {hasAny ? (
          <BookingsList upcoming={upcoming} past={past} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <h2 className="font-semibold text-slate-900">No bookings yet</h2>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              When you book a hotel or activity, it will show up here.
            </p>
            <Link href="/search" className="mt-4">
              <Button>Explore listings</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
