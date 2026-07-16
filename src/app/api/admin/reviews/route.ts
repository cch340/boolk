import { NextResponse } from "next/server";
import { listings, reviews, users } from "@/lib/db";
import { withAdmin } from "@/app/admin/_lib/guard";

export async function GET(): Promise<NextResponse> {
  return withAdmin(async () => {
    const listingById = new Map(listings.list().map((l) => [l.id, l]));
    const userById = new Map(users.list().map((u) => [u.id, u]));

    const rows = reviews
      .list()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .map((r) => ({
        ...r,
        listingTitle: listingById.get(r.listingId)?.title ?? "(deleted listing)",
        userName: userById.get(r.userId)?.name ?? "Unknown",
        userEmail: userById.get(r.userId)?.email ?? "",
      }));

    return NextResponse.json({ reviews: rows });
  });
}
