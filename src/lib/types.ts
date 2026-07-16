// Domain types for Boolk. Prices are integer cents (USD). Dates are ISO strings.

export type Role = "user" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export type ListingType = "hotel" | "activity" | "transport";
export type UnitLabel = "night" | "person";

export type TransportMode = "flight" | "train" | "bus" | "ferry" | "transfer";

/**
 * Route/schedule metadata present iff `Listing.type === 'transport'`.
 * When set, `Listing.city` mirrors `originCity` for search compatibility and
 * `unitLabel` is `'person'`.
 */
export interface TransportInfo {
  mode: TransportMode;
  originCity: string;
  originCode: string;
  destinationCity: string;
  destinationCode: string;
  carrier: string;
  serviceCode: string;
  departureTime: string; // e.g. "08:30" or ISO
  arrivalTime: string;
  durationMinutes: number;
}

export interface Listing {
  id: string;
  type: ListingType;
  title: string;
  slug: string;
  city: string;
  country: string;
  description: string;
  images: string[];
  pricePerUnitCents: number;
  unitLabel: UnitLabel;
  rating: number;
  reviewCount: number;
  amenities: string[];
  highlights: string[];
  maxGuests: number;
  featured: boolean;
  active: boolean;
  createdAt: string;
  /** Present iff type === 'transport'. */
  transport?: TransportInfo;
}

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "refunded";

export interface Booking {
  id: string;
  userId: string;
  listingId: string;
  checkIn: string;
  checkOut?: string;
  guests: number;
  totalCents: number;
  status: BookingStatus;
  guestName: string;
  guestEmail: string;
  createdAt: string;
  /**
   * Round 2 fields. Optional in the type for backward compatibility with old
   * seed/runtime records; the db layer defaults them on read via
   * `withBookingDefaults`, so callers can treat them as always present.
   */
  currency?: string; // display currency chosen at checkout; records stay USD
  pointsRedeemed?: number; // points spent at checkout
  discountCents?: number; // USD value of the redemption
  pointsEarned?: number; // 0 until the booking is completed
}

/** Member points ledger entry. Balance = sum of all deltas for a user. */
export type PointsReason =
  | "earn"
  | "redeem"
  | "redeem-refund"
  | "earn-revoke"
  | "admin-adjust";

export interface PointsTransaction {
  id: string;
  userId: string;
  bookingId?: string;
  delta: number; // integer, +earn / -redeem
  reason: PointsReason;
  note?: string;
  createdAt: string;
}

export type ReviewStatus = "visible" | "hidden";

export interface Review {
  id: string;
  listingId: string;
  userId: string;
  bookingId: string;
  rating: number; // 1-5
  text: string;
  status: ReviewStatus;
  createdAt: string;
}

// A user shape safe to expose to clients (no password hash).
export type PublicUser = Omit<User, "passwordHash">;

// Listing search parameters used by db.searchListings and GET /api/listings.
export type ListingSort = "price-asc" | "price-desc" | "rating";

export interface ListingQuery {
  q?: string;
  type?: ListingType;
  minPrice?: number; // cents
  maxPrice?: number; // cents
  minRating?: number;
  sort?: ListingSort;
  featured?: boolean;
  activeOnly?: boolean;
  // Transport filters (case-insensitive substring on transport route fields).
  mode?: TransportMode;
  origin?: string;
  destination?: string;
}
