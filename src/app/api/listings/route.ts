import { NextResponse } from "next/server";
import { listings } from "@/lib/db";
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

function num(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function GET(req: Request): NextResponse {
  const { searchParams } = new URL(req.url);

  const typeParam = searchParams.get("type");
  const sortParam = searchParams.get("sort");
  const featuredParam = searchParams.get("featured");
  const modeParam = searchParams.get("mode");

  const query: ListingQuery = {
    q: searchParams.get("q") ?? undefined,
    type:
      typeParam && TYPES.includes(typeParam as ListingType)
        ? (typeParam as ListingType)
        : undefined,
    minPrice: num(searchParams.get("minPrice")),
    maxPrice: num(searchParams.get("maxPrice")),
    minRating: num(searchParams.get("minRating")),
    sort:
      sortParam && SORTS.includes(sortParam as ListingSort)
        ? (sortParam as ListingSort)
        : undefined,
    featured:
      featuredParam === "true"
        ? true
        : featuredParam === "false"
          ? false
          : undefined,
    mode:
      modeParam && MODES.includes(modeParam as TransportMode)
        ? (modeParam as TransportMode)
        : undefined,
    origin: searchParams.get("origin") ?? undefined,
    destination: searchParams.get("destination") ?? undefined,
  };

  const results = listings.search(query);
  return NextResponse.json({ listings: results, count: results.length });
}
