import type { BadgeTone } from "@/components/ui";
import type { BookingStatus, ReviewStatus } from "@/lib/types";

/** Allowed booking status transitions (source of truth for API + UI). */
export const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  cancelled: ["refunded"],
  completed: [],
  refunded: [],
};

export function canTransition(
  from: BookingStatus,
  to: BookingStatus,
): boolean {
  return BOOKING_TRANSITIONS[from].includes(to);
}

const BOOKING_TONES: Record<BookingStatus, BadgeTone> = {
  pending: "warning",
  confirmed: "info",
  completed: "success",
  cancelled: "danger",
  refunded: "neutral",
};

export function bookingTone(status: BookingStatus): BadgeTone {
  return BOOKING_TONES[status];
}

/** Human label for a transition action button. */
export const TRANSITION_LABELS: Record<BookingStatus, string> = {
  pending: "Mark pending",
  confirmed: "Confirm",
  completed: "Complete",
  cancelled: "Cancel",
  refunded: "Refund",
};

export function reviewTone(status: ReviewStatus): BadgeTone {
  return status === "visible" ? "success" : "neutral";
}

/** Slugify a title for listing slugs. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
