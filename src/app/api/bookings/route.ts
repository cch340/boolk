import { NextResponse } from "next/server";
import { bookings, listings } from "@/lib/db";
import { requireUser, AuthError } from "@/lib/auth";
import { nightsBetween } from "@/lib/format";
import type { Booking } from "@/lib/types";

export async function GET(): Promise<NextResponse> {
  try {
    const user = await requireUser();
    return NextResponse.json({ bookings: bookings.byUser(user.id) });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || value.trim() === "") return false;
  return !Number.isNaN(new Date(value).getTime());
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const user = await requireUser();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const {
      listingId,
      checkIn,
      checkOut,
      guests,
      guestName,
      guestEmail,
    } = (body ?? {}) as {
      listingId?: string;
      checkIn?: string;
      checkOut?: string;
      guests?: number;
      guestName?: string;
      guestEmail?: string;
    };

    if (!listingId) {
      return NextResponse.json(
        { error: "listingId is required" },
        { status: 400 },
      );
    }

    const listing = listings.get(listingId);
    if (!listing || !listing.active) {
      return NextResponse.json(
        { error: "Listing not found or unavailable" },
        { status: 404 },
      );
    }

    const guestCount =
      typeof guests === "number" ? Math.floor(guests) : NaN;
    if (!Number.isFinite(guestCount) || guestCount < 1) {
      return NextResponse.json(
        { error: "guests must be at least 1" },
        { status: 400 },
      );
    }
    if (guestCount > listing.maxGuests) {
      return NextResponse.json(
        { error: `This listing allows at most ${listing.maxGuests} guests` },
        { status: 400 },
      );
    }

    if (!isValidDate(checkIn)) {
      return NextResponse.json(
        { error: "A valid checkIn date is required" },
        { status: 400 },
      );
    }

    const isHotel = listing.type === "hotel";
    let totalCents: number;
    let normalizedCheckOut: string | undefined;

    if (isHotel) {
      if (!isValidDate(checkOut)) {
        return NextResponse.json(
          { error: "A valid checkOut date is required for stays" },
          { status: 400 },
        );
      }
      if (new Date(checkOut).getTime() <= new Date(checkIn).getTime()) {
        return NextResponse.json(
          { error: "checkOut must be after checkIn" },
          { status: 400 },
        );
      }
      const nights = nightsBetween(checkIn, checkOut);
      totalCents = nights * listing.pricePerUnitCents;
      normalizedCheckOut = checkOut;
    } else {
      totalCents = guestCount * listing.pricePerUnitCents;
      normalizedCheckOut = undefined;
    }

    const created = bookings.create({
      userId: user.id,
      listingId: listing.id,
      checkIn,
      checkOut: normalizedCheckOut,
      guests: guestCount,
      totalCents,
      status: "confirmed",
      guestName:
        typeof guestName === "string" && guestName.trim()
          ? guestName.trim()
          : user.name,
      guestEmail:
        typeof guestEmail === "string" && guestEmail.trim()
          ? guestEmail.trim()
          : user.email,
    } satisfies Omit<Booking, "id" | "createdAt">);

    return NextResponse.json({ booking: created }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
