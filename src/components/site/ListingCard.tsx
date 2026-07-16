import Image from "next/image";
import Link from "next/link";
import { Badge, Card, StarRating } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import type { Listing } from "@/lib/types";

export function ListingCard({ listing }: { listing: Listing }) {
  const unit = listing.unitLabel === "night" ? "night" : "person";
  return (
    <Link href={`/listing/${listing.slug}`} className="group block">
      <Card hover className="h-full overflow-hidden">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
          <Image
            src={listing.images[0]}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge tone={listing.type === "hotel" ? "brand" : "info"}>
              {listing.type === "hotel" ? "Hotel" : "Activity"}
            </Badge>
            {listing.featured && <Badge tone="warning">Featured</Badge>}
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 font-semibold text-slate-900">
              {listing.title}
            </h3>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            {listing.city}, {listing.country}
          </p>
          <div className="mt-2">
            <StarRating
              value={listing.rating}
              size="sm"
              showValue
              reviewCount={listing.reviewCount}
            />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-lg font-bold text-slate-900">
              {formatPrice(listing.pricePerUnitCents)}
            </span>
            <span className="text-sm text-slate-500">/ {unit}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
