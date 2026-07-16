import Image from "next/image";
import Link from "next/link";
import { Badge, Card, StarRating } from "@/components/ui";
import { formatMoney, type CurrencyCode } from "@/lib/currency";
import { getDictionary, t, type Locale, type MessageKey } from "@/lib/i18n";
import type { Listing, TransportMode } from "@/lib/types";

const MODE_KEY: Record<TransportMode, MessageKey> = {
  flight: "transport.mode.flight",
  train: "transport.mode.train",
  bus: "transport.mode.bus",
  ferry: "transport.mode.ferry",
  transfer: "transport.mode.transfer",
};

function durationLabel(
  dict: ReturnType<typeof getDictionary>,
  minutes: number,
): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return t(dict, "transport.durationValue", { hours: h, minutes: m });
}

export function ListingCard({
  listing,
  locale,
  currency,
}: {
  listing: Listing;
  locale: Locale;
  currency: CurrencyCode;
}) {
  const dict = getDictionary(locale);
  const isTransport = listing.type === "transport" && !!listing.transport;
  const priceKey: MessageKey =
    listing.unitLabel === "night"
      ? "listing.pricePerNight"
      : "listing.pricePerPerson";
  const price = formatMoney(listing.pricePerUnitCents, currency);

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
            {isTransport && listing.transport ? (
              <Badge tone="info">
                {t(dict, MODE_KEY[listing.transport.mode])}
              </Badge>
            ) : (
              <Badge tone={listing.type === "hotel" ? "brand" : "info"}>
                {t(
                  dict,
                  listing.type === "hotel"
                    ? "listing.type.hotel"
                    : "listing.type.activity",
                )}
              </Badge>
            )}
            {listing.featured && (
              <Badge tone="warning">{t(dict, "common.featured")}</Badge>
            )}
          </div>
        </div>
        <div className="p-4">
          <h3 className="line-clamp-1 font-semibold text-slate-900">
            {listing.title}
          </h3>

          {isTransport && listing.transport ? (
            <div className="mt-1">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <span>{listing.transport.originCode}</span>
                <span className="text-slate-400">→</span>
                <span>{listing.transport.destinationCode}</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {listing.transport.departureTime} – {listing.transport.arrivalTime}
                <span className="px-1.5 text-slate-300">•</span>
                {durationLabel(dict, listing.transport.durationMinutes)}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {listing.transport.carrier} · {listing.transport.serviceCode}
              </p>
            </div>
          ) : (
            <>
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
            </>
          )}

          <div className="mt-3 text-lg font-bold text-slate-900">
            <span>{t(dict, priceKey, { price })}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
