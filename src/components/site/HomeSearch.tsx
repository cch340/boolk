"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ListingType } from "@/lib/types";

export function HomeSearch() {
  const router = useRouter();
  const [type, setType] = useState<ListingType>("hotel");
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("type", type);
    if (destination.trim()) params.set("q", destination.trim());
    router.push(`/search?${params.toString()}`);
  }

  const isHotel = type === "hotel";

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl bg-white p-3 shadow-card-hover sm:p-4"
    >
      {/* Tabs */}
      <div className="mb-3 inline-flex rounded-xl bg-slate-100 p-1">
        {(["hotel", "activity"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              type === t
                ? "bg-white text-brand-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            {t === "hotel" ? "Hotels" : "Activities"}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            Destination
          </label>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Where are you going?"
            className="h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            {isHotel ? "Check in" : "Date"}
          </label>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>

        {isHotel ? (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              Check out
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
        ) : (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              Guests
            </label>
            <input
              type="number"
              min={1}
              value={guests}
              onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))}
              className="h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
        )}

        <Button type="submit" size="lg" className="w-full md:w-auto">
          Search
        </Button>
      </div>
    </form>
  );
}
