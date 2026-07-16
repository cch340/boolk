"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ListingType } from "@/lib/types";
import { getDictionary, t, type Locale, type MessageKey } from "@/lib/i18n";

const TABS: { type: ListingType; key: MessageKey }[] = [
  { type: "hotel", key: "home.tab.hotels" },
  { type: "activity", key: "home.tab.activities" },
  { type: "transport", key: "home.tab.transport" },
];

const inputClass =
  "h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function HomeSearch({ locale }: { locale: Locale }) {
  const router = useRouter();
  const dict = getDictionary(locale);
  const [type, setType] = useState<ListingType>("hotel");
  const [destination, setDestination] = useState("");
  const [origin, setOrigin] = useState("");
  const [arrival, setArrival] = useState("");
  const [date, setDate] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("type", type);
    if (type === "transport") {
      if (origin.trim()) params.set("origin", origin.trim());
      if (arrival.trim()) params.set("destination", arrival.trim());
    } else if (destination.trim()) {
      params.set("q", destination.trim());
    }
    router.push(`/search?${params.toString()}`);
  }

  const isHotel = type === "hotel";
  const isTransport = type === "transport";

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl bg-white p-3 shadow-card-hover sm:p-4"
    >
      {/* Tabs */}
      <div className="mb-3 inline-flex rounded-xl bg-slate-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.type}
            type="button"
            onClick={() => setType(tab.type)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              type === tab.type
                ? "bg-white text-brand-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            {t(dict, tab.key)}
          </button>
        ))}
      </div>

      {isTransport ? (
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              {t(dict, "home.search.origin")}
            </label>
            <input
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder={t(dict, "home.search.originPh")}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              {t(dict, "home.search.destinationLabel")}
            </label>
            <input
              value={arrival}
              onChange={(e) => setArrival(e.target.value)}
              placeholder={t(dict, "home.search.destinationPhTransport")}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              {t(dict, "home.search.date")}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <Button type="submit" size="lg" className="w-full md:w-auto">
            {t(dict, "home.search.submit")}
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              {t(dict, "home.search.destination")}
            </label>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder={t(dict, "home.search.destinationPh")}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              {isHotel
                ? t(dict, "home.search.checkIn")
                : t(dict, "home.search.date")}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>

          {isHotel ? (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                {t(dict, "home.search.checkOut")}
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className={inputClass}
              />
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                {t(dict, "home.search.guests")}
              </label>
              <input
                type="number"
                min={1}
                value={guests}
                onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))}
                className={inputClass}
              />
            </div>
          )}

          <Button type="submit" size="lg" className="w-full md:w-auto">
            {t(dict, "home.search.submit")}
          </Button>
        </div>
      )}
    </form>
  );
}
