import { bookings, listings, users } from "@/lib/db";
import {
  BookingsManager,
  type AdminBooking,
} from "@/components/admin/BookingsManager";

export default function AdminBookingsPage() {
  const listingById = new Map(listings.list().map((l) => [l.id, l]));
  const userById = new Map(users.list().map((u) => [u.id, u]));

  const rows: AdminBooking[] = bookings
    .list()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .map((b) => {
      const listing = listingById.get(b.listingId);
      const user = userById.get(b.userId);
      return {
        ...b,
        listingTitle: listing?.title ?? "(deleted listing)",
        listingType: listing?.type ?? null,
        listingCity: listing?.city ?? "",
        listingTransport: listing?.transport ?? null,
        userName: user?.name ?? "",
        userEmail: user?.email ?? b.guestEmail,
      };
    });

  return <BookingsManager bookings={rows} />;
}
