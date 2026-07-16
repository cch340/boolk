import type { Listing, ListingType, UnitLabel } from "@/lib/types";
import { slugify } from "./status";

export type ListingInput = Omit<Listing, "id" | "createdAt">;

type RawListing = Record<string, unknown>;

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function bool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function strArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => str(x)).filter((x) => x.trim().length > 0);
}

/** Build a validated ListingInput from an untrusted body. Returns error string on failure. */
export function parseListingInput(
  raw: unknown,
): { data: ListingInput } | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "Invalid body" };
  const r = raw as RawListing;

  const title = str(r.title).trim();
  if (!title) return { error: "Title is required" };

  const type: ListingType = r.type === "activity" ? "activity" : "hotel";
  const unitLabel: UnitLabel =
    r.unitLabel === "person" ? "person" : type === "activity" ? "person" : "night";

  const slug = slugify(str(r.slug).trim() || title);
  if (!slug) return { error: "Slug could not be derived from title" };

  const price = Math.round(num(r.pricePerUnitCents));
  if (price < 0) return { error: "Price must be >= 0" };

  const rating = Math.max(0, Math.min(5, num(r.rating)));
  const maxGuests = Math.max(1, Math.round(num(r.maxGuests, 1)));

  const data: ListingInput = {
    type,
    title,
    slug,
    city: str(r.city).trim(),
    country: str(r.country).trim(),
    description: str(r.description).trim(),
    images: strArray(r.images),
    pricePerUnitCents: price,
    unitLabel,
    rating,
    reviewCount: Math.max(0, Math.round(num(r.reviewCount))),
    amenities: strArray(r.amenities),
    highlights: strArray(r.highlights),
    maxGuests,
    featured: bool(r.featured),
    active: bool(r.active, true),
  };

  return { data };
}
