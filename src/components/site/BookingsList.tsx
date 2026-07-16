"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button, Modal, StarRating } from "@/components/ui";
import type { BadgeTone } from "@/components/ui";
import { formatDate, formatPrice } from "@/lib/format";
import type { BookingStatus } from "@/lib/types";

export interface BookingView {
  id: string;
  status: BookingStatus;
  checkIn: string;
  checkOut?: string;
  guests: number;
  totalCents: number;
  listingTitle: string;
  listingSlug: string;
  listingCity: string;
  listingImage: string;
  listingType: "hotel" | "activity" | "transport";
  cancellable: boolean;
  canReview: boolean;
}

const STATUS_TONE: Record<BookingStatus, BadgeTone> = {
  pending: "warning",
  confirmed: "success",
  completed: "brand",
  cancelled: "neutral",
  refunded: "info",
};

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge tone={STATUS_TONE[status]} className="capitalize">
      {status}
    </Badge>
  );
}

function BookingCard({
  booking,
  onCancel,
  onReview,
  busyId,
}: {
  booking: BookingView;
  onCancel: (id: string) => void;
  onReview: (b: BookingView) => void;
  busyId: string | null;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-card sm:flex-row">
      <Link
        href={`/listing/${booking.listingSlug}`}
        className="relative h-32 w-full shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-24 sm:w-32"
      >
        <Image
          src={booking.listingImage}
          alt={booking.listingTitle}
          fill
          sizes="128px"
          className="object-cover"
        />
      </Link>
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              href={`/listing/${booking.listingSlug}`}
              className="font-semibold text-slate-900 hover:text-brand-700"
            >
              {booking.listingTitle}
            </Link>
            <p className="text-sm text-slate-500">{booking.listingCity}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>
        <div className="mt-2 text-sm text-slate-600">
          {booking.listingType === "hotel" && booking.checkOut ? (
            <span>
              {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
            </span>
          ) : (
            <span>{formatDate(booking.checkIn)}</span>
          )}
          <span className="px-2 text-slate-300">•</span>
          <span>
            {booking.guests} guest{booking.guests === 1 ? "" : "s"}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="font-semibold text-slate-900">
            {formatPrice(booking.totalCents)}
          </span>
          <div className="flex gap-2">
            {booking.canReview && (
              <Button size="sm" onClick={() => onReview(booking)}>
                Leave a review
              </Button>
            )}
            {booking.cancellable && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCancel(booking.id)}
                disabled={busyId === booking.id}
              >
                {busyId === booking.id ? "Cancelling…" : "Cancel"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BookingsList({
  upcoming,
  past,
}: {
  upcoming: BookingView[];
  past: BookingView[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reviewFor, setReviewFor] = useState<BookingView | null>(null);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function cancel(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  function openReview(b: BookingView) {
    setReviewFor(b);
    setRating(5);
    setText("");
    setReviewError(null);
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewFor) return;
    if (!text.trim()) {
      setReviewError("Please write a short review.");
      return;
    }
    setSubmitting(true);
    setReviewError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: reviewFor.id,
          rating,
          text: text.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setReviewError(data.error ?? "Could not submit review.");
        return;
      }
      setReviewFor(null);
      router.refresh();
    } catch {
      setReviewError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Upcoming ({upcoming.length})
        </h2>
        {upcoming.length > 0 ? (
          <div className="space-y-4">
            {upcoming.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onCancel={cancel}
                onReview={openReview}
                busyId={busyId}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
            No upcoming trips. Time to plan your next one.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Past & other ({past.length})
        </h2>
        {past.length > 0 ? (
          <div className="space-y-4">
            {past.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onCancel={cancel}
                onReview={openReview}
                busyId={busyId}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
            Nothing here yet.
          </p>
        )}
      </section>

      <Modal
        open={reviewFor !== null}
        onClose={() => setReviewFor(null)}
        title={reviewFor ? `Review ${reviewFor.listingTitle}` : "Review"}
      >
        <form onSubmit={submitReview} className="space-y-4">
          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Your rating
            </span>
            <StarRating value={rating} size="lg" onChange={setRating} />
          </div>
          <div>
            <label
              htmlFor="review-text"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Your review
            </label>
            <textarea
              id="review-text"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tell other travellers about your experience…"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          {reviewError && <p className="text-sm text-red-600">{reviewError}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReviewFor(null)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit review"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
