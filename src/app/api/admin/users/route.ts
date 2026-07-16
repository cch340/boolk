import { NextResponse } from "next/server";
import { bookings, users } from "@/lib/db";
import { toPublicUser } from "@/lib/auth";
import { withAdmin } from "@/app/admin/_lib/guard";

export async function GET(): Promise<NextResponse> {
  return withAdmin(async () => {
    const counts = bookings.list().reduce<Record<string, number>>((acc, b) => {
      acc[b.userId] = (acc[b.userId] ?? 0) + 1;
      return acc;
    }, {});

    const rows = users
      .list()
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
      .map((u) => ({ ...toPublicUser(u), bookingCount: counts[u.id] ?? 0 }));

    return NextResponse.json({ users: rows });
  });
}
