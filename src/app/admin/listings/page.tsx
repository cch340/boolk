import { bookings, listings } from "@/lib/db";
import { ListingsManager } from "@/components/admin/ListingsManager";

export default function AdminListingsPage() {
  const rows = listings
    .list()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const bookingCounts = bookings.list().reduce<Record<string, number>>(
    (acc, b) => {
      acc[b.listingId] = (acc[b.listingId] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return <ListingsManager listings={rows} bookingCounts={bookingCounts} />;
}
