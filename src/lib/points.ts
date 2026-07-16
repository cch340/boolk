// Member points engine. Ledger-based: balance is the sum of all
// PointsTransaction deltas for a user. Server-side only (imports db).
//
// Rules (see SPEC / QUESTIONS.md #14):
//   - Earn floor(totalCents / 100) points when a booking is completed.
//   - Redeem at checkout: 100 points = 100 cents (USD), in multiples of 100,
//     capped at 50% of the gross order value.
//   - Every earn/redeem/refund/revoke/adjust is an auditable ledger entry.

import { points as pointsRepo } from "@/lib/db";
import type { Booking, PointsTransaction } from "@/lib/types";

/** Points earned per USD spent (1 pt / $1 → floor(cents/100)). */
export const POINTS_PER_USD = 1;
/** Redemption granularity: points must be multiples of this. */
export const REDEEM_UNIT = 100;
/** 100 points is worth 100 cents (USD). */
export const CENTS_PER_POINT = 1;
/** Max share of the gross order that points may cover. */
export const MAX_REDEEM_FRACTION = 0.5;

/** Points earned for a given (net) total in cents. */
export function earnedForCents(totalCents: number): number {
  return Math.floor(Math.max(0, totalCents) / 100) * POINTS_PER_USD;
}

/** Current balance = sum of all ledger deltas for the user. */
export function getBalance(userId: string): number {
  return pointsRepo.byUser(userId).reduce((sum, tx) => sum + tx.delta, 0);
}

/**
 * Largest number of points (a multiple of REDEEM_UNIT) the user may redeem
 * against a gross order, limited by both balance and the 50% cap.
 */
export function maxRedeemablePoints(userId: string, grossCents: number): number {
  const balance = getBalance(userId);
  const capCents = Math.floor(grossCents * MAX_REDEEM_FRACTION);
  const capPoints = Math.floor(capCents / CENTS_PER_POINT);
  const limit = Math.min(balance, capPoints);
  return Math.max(0, Math.floor(limit / REDEEM_UNIT) * REDEEM_UNIT);
}

export interface RedeemResult {
  discountCents: number;
  transaction: PointsTransaction;
}

/**
 * Redeem points for a booking at checkout. Validates that `points` is a
 * positive multiple of REDEEM_UNIT, within balance and within the 50% cap.
 * Writes a 'redeem' entry (negative delta) and returns the USD discount in
 * cents. Throws on any validation failure.
 */
export function redeemForBooking(
  userId: string,
  bookingId: string,
  points: number,
  grossCents: number,
): RedeemResult {
  if (!Number.isInteger(points) || points <= 0) {
    throw new Error("Points to redeem must be a positive integer");
  }
  if (points % REDEEM_UNIT !== 0) {
    throw new Error(`Points must be a multiple of ${REDEEM_UNIT}`);
  }
  const max = maxRedeemablePoints(userId, grossCents);
  if (points > max) {
    throw new Error(
      `Cannot redeem ${points} points (max ${max} for this order)`,
    );
  }
  const discountCents = points * CENTS_PER_POINT;
  const transaction = pointsRepo.create({
    userId,
    bookingId,
    delta: -points,
    reason: "redeem",
    note: `Redeemed ${points} points for $${(discountCents / 100).toFixed(2)}`,
  });
  return { discountCents, transaction };
}

/**
 * Award earned points when a booking is completed. Idempotent: skips if an
 * 'earn' entry already exists for this booking. Returns the created entry, or
 * null if nothing was awarded (already earned, or zero points).
 */
export function awardForBooking(booking: Booking): PointsTransaction | null {
  const existing = pointsRepo
    .byBooking(booking.id)
    .some((tx) => tx.reason === "earn");
  if (existing) return null;

  const earned = earnedForCents(booking.totalCents);
  if (earned <= 0) return null;

  return pointsRepo.create({
    userId: booking.userId,
    bookingId: booking.id,
    delta: earned,
    reason: "earn",
    note: `Earned ${earned} points for booking ${booking.id}`,
  });
}

/**
 * Refund points that were redeemed on a booking (e.g. when it is cancelled).
 * Idempotent: skips if already refunded or if nothing was redeemed.
 */
export function refundRedemption(booking: Booking): PointsTransaction | null {
  const ledger = pointsRepo.byBooking(booking.id);
  const alreadyRefunded = ledger.some((tx) => tx.reason === "redeem-refund");
  if (alreadyRefunded) return null;

  const redeemed = ledger
    .filter((tx) => tx.reason === "redeem")
    .reduce((sum, tx) => sum + Math.abs(tx.delta), 0);
  if (redeemed <= 0) return null;

  return pointsRepo.create({
    userId: booking.userId,
    bookingId: booking.id,
    delta: redeemed,
    reason: "redeem-refund",
    note: `Refunded ${redeemed} redeemed points for booking ${booking.id}`,
  });
}

/**
 * Revoke points earned on a booking (e.g. when a completed booking is
 * refunded). Idempotent: skips if already revoked or nothing was earned.
 */
export function revokeEarn(booking: Booking): PointsTransaction | null {
  const ledger = pointsRepo.byBooking(booking.id);
  const alreadyRevoked = ledger.some((tx) => tx.reason === "earn-revoke");
  if (alreadyRevoked) return null;

  const earned = ledger
    .filter((tx) => tx.reason === "earn")
    .reduce((sum, tx) => sum + tx.delta, 0);
  if (earned <= 0) return null;

  return pointsRepo.create({
    userId: booking.userId,
    bookingId: booking.id,
    delta: -earned,
    reason: "earn-revoke",
    note: `Revoked ${earned} earned points for booking ${booking.id}`,
  });
}

/**
 * Manual admin adjustment. Rejects any adjustment that would drive the
 * balance below zero.
 */
export function adminAdjust(
  userId: string,
  delta: number,
  note?: string,
): PointsTransaction {
  if (!Number.isInteger(delta) || delta === 0) {
    throw new Error("Adjustment must be a non-zero integer");
  }
  const balance = getBalance(userId);
  if (balance + delta < 0) {
    throw new Error("Adjustment would make the balance negative");
  }
  return pointsRepo.create({
    userId,
    delta,
    reason: "admin-adjust",
    note: note?.trim() || undefined,
  });
}
