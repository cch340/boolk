import type {
  Listing,
  ListingType,
  UnitLabel,
  TransportInfo,
  TransportMode,
} from "@/lib/types";
import { slugify } from "./status";
import { TRANSPORT_MODES } from "./transport";

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

/**
 * Validate the transport metadata for a transport listing. Returns the parsed
 * TransportInfo or an error string. All fields are required, durationMinutes
 * must be a positive integer.
 */
function parseTransport(
  v: unknown,
): { transport: TransportInfo } | { error: string } {
  if (!v || typeof v !== "object") {
    return { error: "Transport details are required for transport listings" };
  }
  const t = v as RawListing;

  const mode = str(t.mode).trim() as TransportMode;
  if (!TRANSPORT_MODES.includes(mode)) {
    return { error: "A valid transport mode is required" };
  }

  const originCity = str(t.originCity).trim();
  const originCode = str(t.originCode).trim();
  const destinationCity = str(t.destinationCity).trim();
  const destinationCode = str(t.destinationCode).trim();
  const carrier = str(t.carrier).trim();
  const serviceCode = str(t.serviceCode).trim();
  const departureTime = str(t.departureTime).trim();
  const arrivalTime = str(t.arrivalTime).trim();

  const missing = [
    ["origin city", originCity],
    ["origin code", originCode],
    ["destination city", destinationCity],
    ["destination code", destinationCode],
    ["carrier", carrier],
    ["service code", serviceCode],
    ["departure time", departureTime],
    ["arrival time", arrivalTime],
  ].find(([, value]) => !value);
  if (missing) {
    return { error: `Transport ${missing[0]} is required` };
  }

  const durationMinutes = Math.round(num(t.durationMinutes));
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    return { error: "Transport duration must be a positive number of minutes" };
  }

  return {
    transport: {
      mode,
      originCity,
      originCode,
      destinationCity,
      destinationCode,
      carrier,
      serviceCode,
      departureTime,
      arrivalTime,
      durationMinutes,
    },
  };
}

/** Build a validated ListingInput from an untrusted body. Returns error string on failure. */
export function parseListingInput(
  raw: unknown,
): { data: ListingInput } | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "Invalid body" };
  const r = raw as RawListing;

  const title = str(r.title).trim();
  if (!title) return { error: "Title is required" };

  const type: ListingType =
    r.type === "activity"
      ? "activity"
      : r.type === "transport"
        ? "transport"
        : "hotel";

  // Transport is always priced per person; activities per person; else per night.
  const unitLabel: UnitLabel =
    type === "transport"
      ? "person"
      : r.unitLabel === "person"
        ? "person"
        : type === "activity"
          ? "person"
          : "night";

  const slug = slugify(str(r.slug).trim() || title);
  if (!slug) return { error: "Slug could not be derived from title" };

  const price = Math.round(num(r.pricePerUnitCents));
  if (price < 0) return { error: "Price must be >= 0" };

  const rating = Math.max(0, Math.min(5, num(r.rating)));
  const maxGuests = Math.max(1, Math.round(num(r.maxGuests, 1)));

  let transport: TransportInfo | undefined;
  let city = str(r.city).trim();

  if (type === "transport") {
    const parsedTransport = parseTransport(r.transport);
    if ("error" in parsedTransport) return { error: parsedTransport.error };
    transport = parsedTransport.transport;
    // Keep city synced to the origin city for search compatibility.
    city = transport.originCity;
  }

  const data: ListingInput = {
    type,
    title,
    slug,
    city,
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
    // Always set the key: the object when transport, else undefined so a PATCH
    // that switches a listing away from transport strips the stale metadata.
    transport,
  };

  return { data };
}
