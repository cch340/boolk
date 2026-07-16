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

export type ListingType = "hotel" | "activity";
export type UnitLabel = "night" | "person";

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
}
