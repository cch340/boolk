// Helpers to translate raw URL searchParams into a typed ListingQuery
// for the /search server component.

import type {
  ListingQuery,
  ListingSort,
  ListingType,
  TransportMode,
} from "@/lib/types";

const SORTS: readonly ListingSort[] = ["price-asc", "price-desc", "rating"];
const TYPES: readonly ListingType[] = ["hotel", "activity", "transport"];
const MODES: readonly TransportMode[] = [
  "flight",
  "train",
  "bus",
  "ferry",
  "transfer",
];

export type RawParams = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function toNumber(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** Dollars-string (from a form) -> integer cents, or undefined. */
export function dollarsToCents(value: string | undefined): number | undefined {
  const n = toNumber(value);
  return n === undefined ? undefined : Math.round(n * 100);
}

export function parseListingQuery(params: RawParams): ListingQuery {
  const type = one(params.type);
  const sort = one(params.sort);
  const mode = one(params.mode);
  const minRating = toNumber(one(params.minRating));

  return {
    q: one(params.q)?.trim() || undefined,
    type:
      type && TYPES.includes(type as ListingType)
        ? (type as ListingType)
        : undefined,
    minPrice: dollarsToCents(one(params.minPrice)),
    maxPrice: dollarsToCents(one(params.maxPrice)),
    minRating: minRating,
    sort:
      sort && SORTS.includes(sort as ListingSort)
        ? (sort as ListingSort)
        : undefined,
    mode:
      mode && MODES.includes(mode as TransportMode)
        ? (mode as TransportMode)
        : undefined,
    origin: one(params.origin)?.trim() || undefined,
    destination: one(params.destination)?.trim() || undefined,
  };
}
