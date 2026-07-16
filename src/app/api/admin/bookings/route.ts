import { NextResponse } from "next/server";
import { bookings, listings, users } from "@/lib/db";
import type { BookingStatus } from "@/lib/types";
import { withAdmin } from "@/app/admin/_lib/guard";

const STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "refunded",
];

export async function GET(req: Request): Promise<NextResponse> {
  return withAdmin(async () => {
    const url = new URL(req.url);
    const statusParam = url.searchParams.get("status");
    const typeParam = url.searchParams.get("type");
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();

    const listingById = new Map(listings.list().map((l) => [l.id, l]));
    const userById = new Map(users.list().map((u) => [u.id, u]));

    let rows = bookings
      .list()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    if (statusParam && STATUSES.includes(statusParam as BookingStatus)) {
      rows = rows.filter((b) => b.status === statusParam);
    }
    if (typeParam === "hotel" || typeParam === "activity") {
      rows = rows.filter((b) => listingById.get(b.listingId)?.type === typeParam);
    }
    if (q) {
      rows = rows.filter((b) => {
        const listing = listingById.get(b.listingId);
        const hay = [
          b.guestName,
          b.guestEmail,
          listing?.title ?? "",
          listing?.city ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    const enriched = rows.map((b) => {
      const listing = listingById.get(b.listingId);
      const user = userById.get(b.userId);
      return {
        ...b,
        listingTitle: listing?.title ?? "(deleted listing)",
        listingType: listing?.type ?? null,
        listingCity: listing?.city ?? "",
        userName: user?.name ?? "",
        userEmail: user?.email ?? b.guestEmail,
      };
    });

    return NextResponse.json({ bookings: enriched });
  });
}
