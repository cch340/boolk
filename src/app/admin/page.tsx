import Link from "next/link";
import { bookings, listings, users } from "@/lib/db";
import type { BookingStatus } from "@/lib/types";
import { formatPrice, formatDate } from "@/lib/format";
import { Card, CardBody, Badge } from "@/components/ui";
import { PageHeader, EmptyState } from "@/components/admin/PageHeader";
import { bookingTone } from "@/app/admin/_lib/status";

const STATUS_ORDER: BookingStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "refunded",
];

export default function AdminDashboardPage() {
  const allBookings = bookings.list();
  const allListings = listings.list();
  const allUsers = users.list();
  const listingById = new Map(allListings.map((l) => [l.id, l]));
  const userById = new Map(allUsers.map((u) => [u.id, u]));

  const revenueCents = allBookings
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .reduce((sum, b) => sum + b.totalCents, 0);

  const byStatus = STATUS_ORDER.map((status) => ({
    status,
    count: allBookings.filter((b) => b.status === status).length,
  }));

  const recent = [...allBookings]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 8);

  const kpis = [
    { label: "Revenue", value: formatPrice(revenueCents), hint: "Confirmed + completed" },
    { label: "Bookings", value: String(allBookings.length), hint: "All time" },
    {
      label: "Active listings",
      value: String(allListings.filter((l) => l.active).length),
      hint: `${allListings.length} total`,
    },
    { label: "Users", value: String(allUsers.length), hint: "Registered" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of Boolk activity." />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardBody>
              <p className="text-sm font-medium text-slate-500">{k.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {k.value}
              </p>
              <p className="mt-1 text-xs text-slate-400">{k.hint}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Bookings by status */}
      <h2 className="mb-3 mt-8 text-lg font-semibold text-slate-900">
        Bookings by status
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {byStatus.map((s) => (
          <Card key={s.status}>
            <CardBody className="flex items-center justify-between">
              <Badge tone={bookingTone(s.status)}>{s.status}</Badge>
              <span className="text-xl font-semibold text-slate-900">
                {s.count}
              </span>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Recent bookings
        </h2>
        <Link
          href="/admin/bookings"
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          View all
        </Link>
      </div>

      {recent.length === 0 ? (
        <EmptyState title="No bookings yet" />
      ) : (
        <Card className="overflow-hidden">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Guest</th>
                  <th className="px-4 py-3 font-medium">Listing</th>
                  <th className="px-4 py-3 font-medium">Dates</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recent.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {b.guestName}
                      </div>
                      <div className="text-xs text-slate-400">
                        {b.guestEmail}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {listingById.get(b.listingId)?.title ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(b.checkIn)}
                      {b.checkOut ? ` – ${formatDate(b.checkOut)}` : ""}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {formatPrice(b.totalCents)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={bookingTone(b.status)}>{b.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <ul className="divide-y divide-slate-100 sm:hidden">
            {recent.map((b) => (
              <li key={b.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {b.guestName}
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {listingById.get(b.listingId)?.title ?? "—"}
                    </p>
                  </div>
                  <Badge tone={bookingTone(b.status)}>{b.status}</Badge>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    {formatDate(b.checkIn)}
                    {b.checkOut ? ` – ${formatDate(b.checkOut)}` : ""}
                  </span>
                  <span className="font-medium text-slate-900">
                    {formatPrice(b.totalCents)}
                  </span>
                </div>
                {userById.get(b.userId) && (
                  <p className="mt-1 text-xs text-slate-400">
                    {userById.get(b.userId)?.email}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
