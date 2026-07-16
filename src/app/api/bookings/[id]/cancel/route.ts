import { NextResponse } from "next/server";
import { bookings } from "@/lib/db";
import { requireUser, AuthError } from "@/lib/auth";
import { refundRedemption } from "@/lib/points";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const { id } = await params;

    const booking = bookings.get(id);
    if (!booking || booking.userId !== user.id) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "pending" && booking.status !== "confirmed") {
      return NextResponse.json(
        { error: "Only pending or confirmed bookings can be cancelled" },
        { status: 400 },
      );
    }

    const updated = bookings.update(id, { status: "cancelled" });
    // Return any points spent on this booking (idempotent).
    if (updated) refundRedemption(updated);
    return NextResponse.json({ booking: updated });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
