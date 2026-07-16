import { NextResponse } from "next/server";
import { bookings } from "@/lib/db";
import type { BookingStatus } from "@/lib/types";
import { withAdmin, readJson } from "@/app/admin/_lib/guard";
import { canTransition } from "@/app/admin/_lib/status";

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

    const updated = bookings.update(id, { status: target });
    return NextResponse.json({ booking: updated });
  });
}
