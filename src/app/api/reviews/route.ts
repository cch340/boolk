import { NextResponse } from "next/server";
import { bookings, reviews } from "@/lib/db";
import { requireUser, AuthError } from "@/lib/auth";
import type { Review } from "@/lib/types";

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

    const { bookingId, rating, text } = (body ?? {}) as {
      bookingId?: string;
      rating?: number;
      text?: string;
    };

    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId is required" },
        { status: 400 },
      );
    }

    const booking = bookings.get(bookingId);
    if (!booking || booking.userId !== user.id) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.status !== "completed") {
      return NextResponse.json(
        { error: "You can only review completed bookings" },
        { status: 400 },
      );
    }

    const ratingNum = typeof rating === "number" ? Math.round(rating) : NaN;
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json(
        { error: "rating must be between 1 and 5" },
        { status: 400 },
      );
    }

    const reviewText = typeof text === "string" ? text.trim() : "";
    if (!reviewText) {
      return NextResponse.json(
        { error: "Review text is required" },
        { status: 400 },
      );
    }

    const existing = reviews
      .byUser(user.id)
      .find((r) => r.bookingId === bookingId);
    if (existing) {
      return NextResponse.json(
        { error: "You have already reviewed this booking" },
        { status: 409 },
      );
    }

    const created = reviews.create({
      listingId: booking.listingId,
      userId: user.id,
      bookingId,
      rating: ratingNum,
      text: reviewText,
      status: "visible",
    } satisfies Omit<Review, "id" | "createdAt">);

    return NextResponse.json({ review: created }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
