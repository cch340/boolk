import { NextResponse } from "next/server";
import { bookings } from "@/lib/db";
import type { Booking, BookingStatus } from "@/lib/types";
import { withAdmin, readJson } from "@/app/admin/_lib/guard";
import { canTransition } from "@/app/admin/_lib/status";
import { awardForBooking, refundRedemption, revokeEarn } from "@/lib/points";

type Ctx = { params: Promise<{ id: string }> };

const STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "refunded",
];

export async function PATCH(req: Request, ctx: Ctx): Promise<NextResponse> {
  return withAdmin(async () => {
    const { id } = await ctx.params;
    const existing = bookings.get(id);
    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const body = await readJson<{ status?: string }>(req);
    const next = body?.status;
    if (!next || !STATUSES.includes(next as BookingStatus)) {
      return NextResponse.json(
        { error: "A valid status is required" },
        { status: 400 },
      );
    }
    const target = next as BookingStatus;
    if (!canTransition(existing.status, target)) {
      return NextResponse.json(
        {
          error: `Cannot transition from ${existing.status} to ${target}`,
        },
        { status: 409 },
      );
    }

    let updated = bookings.update(id, { status: target }) as Booking;

    // Points side-effects. All engine calls are idempotent; wrap so a points
    // failure never silently 500s the transition — surface it as a warning.
    let warning: string | undefined;
    try {
      if (target === "completed") {
        const earned = awardForBooking(updated);
        if (earned) {
          // Persist the earned total on the booking for display.
          updated =
            (bookings.update(id, { pointsEarned: earned.delta }) as Booking) ??
            updated;
        }
      } else if (target === "refunded") {
        revokeEarn(updated);
      } else if (target === "cancelled") {
        refundRedemption(updated);
      }
    } catch (err) {
      warning =
        err instanceof Error
          ? `Status updated, but points update failed: ${err.message}`
          : "Status updated, but points update failed";
    }

    return NextResponse.json(warning ? { booking: updated, warning } : { booking: updated });
  });
}
