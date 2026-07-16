import { NextResponse } from "next/server";
import { bookings, listings, users, points } from "@/lib/db";
import type { BookingStatus, ListingType } from "@/lib/types";
import { withAdmin } from "@/app/admin/_lib/guard";

export async function GET(): Promise<NextResponse> {
  return withAdmin(async () => {
    const allBookings = bookings.list();
    const allListings = listings.list();
    const allUsers = users.list();

    const revenueCents = allBookings
      .filter((b) => b.status === "confirmed" || b.status === "completed")
      .reduce((sum, b) => sum + b.totalCents, 0);

    const byType = allListings.reduce<Record<ListingType, number>>(
      (acc, l) => {
        acc[l.type] = (acc[l.type] ?? 0) + 1;
        return acc;
      },
      { hotel: 0, activity: 0, transport: 0 },
    );

    // Points outstanding = sum of every ledger delta across all users.
    const pointsOutstanding = points
      .list()
      .reduce((sum, tx) => sum + tx.delta, 0);

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
      listingsByType: byType,
      totalUsers: allUsers.length,
      pointsOutstanding,
      byStatus,
    });
  });
}
