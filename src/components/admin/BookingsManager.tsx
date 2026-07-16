"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Booking, BookingStatus, ListingType } from "@/lib/types";
import { formatPrice, formatDate } from "@/lib/format";
import { Button, Input, Select, Badge, Card } from "@/components/ui";
import { PageHeader, EmptyState } from "@/components/admin/PageHeader";
import {
  BOOKING_TRANSITIONS,
  TRANSITION_LABELS,
  bookingTone,
} from "@/app/admin/_lib/status";

export interface AdminBooking extends Booking {
  listingTitle: string;
  listingType: ListingType | null;
  listingCity: string;
  userName: string;
  userEmail: string;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

export function BookingsManager({ bookings }: { bookings: AdminBooking[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<"all" | BookingStatus>("all");
  const [type, setType] = useState<"all" | ListingType>("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((b) => {
      if (status !== "all" && b.status !== status) return false;
      if (type !== "all" && b.listingType !== type) return false;
      if (!q) return true;
      return [b.guestName, b.guestEmail, b.listingTitle, b.listingCity].some(
        (f) => f.toLowerCase().includes(q),
      );
    });
  }, [bookings, status, type, query]);

  async function transition(b: AdminBooking, next: BookingStatus) {
    setBusyId(b.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to update booking");
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Bookings"
        description={`${bookings.length} total`}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="sm:max-w-xs sm:flex-1">
          <Input
            placeholder="Search guest or listing…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="sm:w-44">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as "all" | BookingStatus)}
            options={STATUS_OPTIONS}
          />
        </div>
        <div className="sm:w-40">
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as "all" | ListingType)}
            options={[
              { value: "all", label: "All types" },
              { value: "hotel", label: "Hotels" },
              { value: "activity", label: "Activities" },
            ]}
          />
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title="No bookings match"
          description="Adjust the filters or search."
        />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {filtered.map((b) => {
              const nexts = BOOKING_TRANSITIONS[b.status];
              const open = expanded === b.id;
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : b.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
                    aria-expanded={open}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-slate-900">
                          {b.guestName}
                        </span>
                        <Badge tone={bookingTone(b.status)}>{b.status}</Badge>
                      </div>
                      <p className="truncate text-sm text-slate-500">
                        {b.listingTitle}
                        {b.listingCity ? ` · ${b.listingCity}` : ""}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-sm text-slate-600">
                        {formatDate(b.checkIn)}
                        {b.checkOut ? ` – ${formatDate(b.checkOut)}` : ""}
                      </p>
                      <p className="text-sm font-medium text-slate-900">
                        {formatPrice(b.totalCents)}
                      </p>
                    </div>
                    <svg
                      viewBox="0 0 20 20"
                      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {open && (
                    <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Guest contact
                          </h3>
                          <p className="text-sm text-slate-900">
                            {b.guestName}
                          </p>
                          <p className="text-sm text-slate-600">
                            {b.guestEmail}
                          </p>
                          {b.userName && b.userName !== b.guestName && (
                            <p className="mt-1 text-xs text-slate-400">
                              Account: {b.userName} ({b.userEmail})
                            </p>
                          )}
                        </div>
                        <div>
                          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Price breakdown
                          </h3>
                          <dl className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <dt className="text-slate-500">Guests</dt>
                              <dd className="text-slate-900">{b.guests}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-slate-500">Check-in</dt>
                              <dd className="text-slate-900">
                                {formatDate(b.checkIn)}
                              </dd>
                            </div>
                            {b.checkOut && (
                              <div className="flex justify-between">
                                <dt className="text-slate-500">Check-out</dt>
                                <dd className="text-slate-900">
                                  {formatDate(b.checkOut)}
                                </dd>
                              </div>
                            )}
                            <div className="flex justify-between border-t border-slate-200 pt-1 font-medium">
                              <dt className="text-slate-700">Total</dt>
                              <dd className="text-slate-900">
                                {formatPrice(b.totalCents)}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {nexts.length === 0 ? (
                          <span className="text-sm text-slate-400">
                            No further actions available.
                          </span>
                        ) : (
                          nexts.map((next) => (
                            <Button
                              key={next}
                              size="sm"
                              variant={
                                next === "cancelled" || next === "refunded"
                                  ? "outline"
                                  : "primary"
                              }
                              disabled={busyId === b.id}
                              onClick={() => transition(b, next)}
                            >
                              {TRANSITION_LABELS[next]}
                            </Button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
