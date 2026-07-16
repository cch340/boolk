import type { Metadata } from "next";
import { listings } from "@/lib/db";
import { ListingCard } from "@/components/site/ListingCard";
import {
  SearchFilters,
  type SearchFilterValues,
} from "@/components/site/SearchFilters";
import { parseListingQuery, type RawParams } from "../_lib/search-params";

export const metadata: Metadata = { title: "Search" };

function str(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const params = await searchParams;
  const query = parseListingQuery(params);
  const results = listings.search(query);

  const initial: SearchFilterValues = {
    q: str(params.q),
    type: str(params.type),
    minPrice: str(params.minPrice),
    maxPrice: str(params.maxPrice),
    minRating: str(params.minRating),
    sort: str(params.sort),
  };

  const heading = query.type
    ? query.type === "hotel"
      ? "Hotels"
      : "Activities"
    : "All listings";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{heading}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {results.length} result{results.length === 1 ? "" : "s"}
          {query.q ? ` for “${query.q}”` : ""}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <SearchFilters initial={initial} />

        <div>
          {results.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx={11} cy={11} r={7} />
                  <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
                </svg>
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">
                No listings found
              </h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Try widening your price range, lowering the rating filter, or
                searching a different destination.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
