// JSON-file repository layer for Boolk.
//
// - Seed data lives in `data/seed/*.json` (committed).
// - On first write for an entity, the seed is copied to `data/runtime/*.json`.
// - Reads prefer the runtime copy, falling back to seed.
// - An in-memory cache backs all reads; mutations write through synchronously.
//
// All persistence is synchronous fs — this is a demo store, not a production DB.

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  User,
  Listing,
  Booking,
  Review,
  ListingQuery,
  PointsTransaction,
} from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const SEED_DIR = path.join(DATA_DIR, "seed");
const RUNTIME_DIR = path.join(DATA_DIR, "runtime");

type EntityName = "users" | "listings" | "bookings" | "reviews" | "points";

interface Schema {
  users: User[];
  listings: Listing[];
  bookings: Booking[];
  reviews: Review[];
  points: PointsTransaction[];
}

const cache: Partial<Record<EntityName, unknown[]>> = {};

function seedPath(name: EntityName): string {
  return path.join(SEED_DIR, `${name}.json`);
}

function runtimePath(name: EntityName): string {
  return path.join(RUNTIME_DIR, `${name}.json`);
}

function readJsonFile<T>(file: string): T[] {
  const raw = fs.readFileSync(file, "utf8");
  return JSON.parse(raw) as T[];
}

function load<K extends EntityName>(name: K): Schema[K] {
  const cached = cache[name];
  if (cached) return cached as Schema[K];

  const runtime = runtimePath(name);
  const source = fs.existsSync(runtime) ? runtime : seedPath(name);
  const rows = readJsonFile<Schema[K][number]>(source);
  cache[name] = rows;
  return rows as Schema[K];
}

function persist<K extends EntityName>(name: K, rows: Schema[K]): void {
  cache[name] = rows;
  if (!fs.existsSync(RUNTIME_DIR)) {
    fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  }
  fs.writeFileSync(runtimePath(name), JSON.stringify(rows, null, 2), "utf8");
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}

// ---------------------------------------------------------------------------
// Generic CRUD factory
// ---------------------------------------------------------------------------

interface HasId {
  id: string;
}

function makeRepo<K extends EntityName>(name: K, idPrefix: string) {
  type Row = Schema[K][number] & HasId;

  function list(): Row[] {
    return clone(load(name)) as Row[];
  }

  function get(id: string): Row | undefined {
    const found = (load(name) as Row[]).find((r) => r.id === id);
    return found ? (clone(found) as Row) : undefined;
  }

  function create(data: Omit<Row, "id" | "createdAt"> & Partial<HasId>): Row {
    const rows = load(name) as Row[];
    const row = {
      ...(data as Row),
      id: data.id ?? newId(idPrefix),
      createdAt:
        (data as Partial<Row> & { createdAt?: string }).createdAt ??
        new Date().toISOString(),
    } as Row;
    const next = [...rows, row] as Schema[K];
    persist(name, next);
    return clone(row);
  }

  function update(id: string, patch: Partial<Row>): Row | undefined {
    const rows = load(name) as Row[];
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    const updated = { ...rows[idx], ...patch, id } as Row;
    const next = [...rows];
    next[idx] = updated;
    persist(name, next as Schema[K]);
    return clone(updated);
  }

  function remove(id: string): boolean {
    const rows = load(name) as Row[];
    const next = rows.filter((r) => r.id !== id);
    if (next.length === rows.length) return false;
    persist(name, next as Schema[K]);
    return true;
  }

  return { list, get, create, update, remove };
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

const usersRepo = makeRepo("users", "usr");

export const users = {
  ...usersRepo,
  findByEmail(email: string): User | undefined {
    const target = email.trim().toLowerCase();
    return usersRepo
      .list()
      .find((u) => u.email.trim().toLowerCase() === target);
  },
};

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

const listingsRepo = makeRepo("listings", "lst");

export const listings = {
  ...listingsRepo,
  findBySlug(slug: string): Listing | undefined {
    return listingsRepo.list().find((l) => l.slug === slug);
  },
  featured(limit?: number): Listing[] {
    const rows = listingsRepo
      .list()
      .filter((l) => l.active && l.featured)
      .sort((a, b) => b.rating - a.rating);
    return typeof limit === "number" ? rows.slice(0, limit) : rows;
  },
  search(query: ListingQuery = {}): Listing[] {
    const {
      q,
      type,
      minPrice,
      maxPrice,
      minRating,
      sort,
      featured,
      activeOnly = true,
      mode,
      origin,
      destination,
    } = query;

    let rows = listingsRepo.list();

    if (activeOnly) rows = rows.filter((l) => l.active);
    if (type) rows = rows.filter((l) => l.type === type);
    if (typeof featured === "boolean")
      rows = rows.filter((l) => l.featured === featured);

    if (mode) rows = rows.filter((l) => l.transport?.mode === mode);

    const originNeedle = origin?.trim().toLowerCase();
    if (originNeedle) {
      rows = rows.filter((l) =>
        [l.transport?.originCity, l.transport?.originCode].some((f) =>
          f?.toLowerCase().includes(originNeedle),
        ),
      );
    }

    const destNeedle = destination?.trim().toLowerCase();
    if (destNeedle) {
      rows = rows.filter((l) =>
        [l.transport?.destinationCity, l.transport?.destinationCode].some((f) =>
          f?.toLowerCase().includes(destNeedle),
        ),
      );
    }

    if (q && q.trim()) {
      const needle = q.trim().toLowerCase();
      rows = rows.filter((l) => {
        const fields = [l.title, l.city, l.country, l.description];
        // For transport, also match route cities/codes and carrier.
        if (l.type === "transport" && l.transport) {
          const t = l.transport;
          fields.push(
            t.originCity,
            t.originCode,
            t.destinationCity,
            t.destinationCode,
            t.carrier,
          );
        }
        return fields.some((field) => field.toLowerCase().includes(needle));
      });
    }

    if (typeof minPrice === "number")
      rows = rows.filter((l) => l.pricePerUnitCents >= minPrice);
    if (typeof maxPrice === "number")
      rows = rows.filter((l) => l.pricePerUnitCents <= maxPrice);
    if (typeof minRating === "number")
      rows = rows.filter((l) => l.rating >= minRating);

    switch (sort) {
      case "price-asc":
        rows.sort((a, b) => a.pricePerUnitCents - b.pricePerUnitCents);
        break;
      case "price-desc":
        rows.sort((a, b) => b.pricePerUnitCents - a.pricePerUnitCents);
        break;
      case "rating":
        rows.sort((a, b) => b.rating - a.rating);
        break;
      default:
        // Default: featured first, then rating.
        rows.sort((a, b) => {
          if (a.featured !== b.featured) return a.featured ? -1 : 1;
          return b.rating - a.rating;
        });
    }

    return rows;
  },
};

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

const bookingsRepo = makeRepo("bookings", "bkg");

/**
 * Normalises the Round 2 fields on read so callers can treat them as always
 * present, even for older seed/runtime records that predate them.
 */
function withBookingDefaults(b: Booking): Booking {
  return {
    ...b,
    currency: b.currency ?? "USD",
    pointsRedeemed: b.pointsRedeemed ?? 0,
    discountCents: b.discountCents ?? 0,
    pointsEarned: b.pointsEarned ?? 0,
  };
}

export const bookings = {
  ...bookingsRepo,
  get(id: string): Booking | undefined {
    const b = bookingsRepo.get(id);
    return b ? withBookingDefaults(b) : undefined;
  },
  list(): Booking[] {
    return bookingsRepo.list().map(withBookingDefaults);
  },
  byUser(userId: string): Booking[] {
    return bookingsRepo
      .list()
      .filter((b) => b.userId === userId)
      .map(withBookingDefaults)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  },
  byListing(listingId: string): Booking[] {
    return bookingsRepo
      .list()
      .filter((b) => b.listingId === listingId)
      .map(withBookingDefaults);
  },
};

// ---------------------------------------------------------------------------
// Points ledger
// ---------------------------------------------------------------------------

const pointsRepo = makeRepo("points", "pts");

export const points = {
  ...pointsRepo,
  byUser(userId: string): PointsTransaction[] {
    return pointsRepo
      .list()
      .filter((p) => p.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  },
  byBooking(bookingId: string): PointsTransaction[] {
    return pointsRepo.list().filter((p) => p.bookingId === bookingId);
  },
};

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

const reviewsRepo = makeRepo("reviews", "rev");

export const reviews = {
  ...reviewsRepo,
  byListing(listingId: string, opts: { visibleOnly?: boolean } = {}): Review[] {
    const { visibleOnly = false } = opts;
    return reviewsRepo
      .list()
      .filter(
        (r) =>
          r.listingId === listingId &&
          (!visibleOnly || r.status === "visible"),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  },
  byUser(userId: string): Review[] {
    return reviewsRepo.list().filter((r) => r.userId === userId);
  },
};

// ---------------------------------------------------------------------------
// Test / dev helpers
// ---------------------------------------------------------------------------

/** Clears the in-memory cache (used by scripts/tests to force a reload). */
export function __resetCache(): void {
  (Object.keys(cache) as EntityName[]).forEach((k) => delete cache[k]);
}
