import { NextResponse } from "next/server";
import { bookings, listings, users } from "@/lib/db";
import type { BookingStatus } from "@/lib/types";
import { withAdmin } from "@/app/admin/_lib/guard";

export async function GET(): Promise<NextResponse> {
  return withAdmin(async () => {
    const allBookings = bookings.list();
    const allListings = listings.list();
    const allUsers = users.list();

    const revenueCents = allBookings
      .filter((b) => b.status === "confirmed" || b.status === "completed")
      .reduce((sum, b) => sum + b.totalCents, 0);

    const byStatus = allBookings.reduce<Record<BookingStatus, number>>(
      (acc, b) => {
        acc[b.status] = (acc[b.status] ?? 0) + 1;
        return acc;
      },
      {
        pending: 0,
        confirmed: 0,
        cancelled: 0,
        completed: 0,
        refunded: 0,
      },
    );

    return NextResponse.json({
      revenueCents,
      totalBookings: allBookings.length,
      activeListings: allListings.filter((l) => l.active).length,
      totalListings: allListings.length,
      totalUsers: allUsers.length,
      byStatus,
    });
  });
}
