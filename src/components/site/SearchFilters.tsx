"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select } from "@/components/ui";
import { cn } from "@/lib/cn";
import { getDictionary, t, type Locale } from "@/lib/i18n";

export interface SearchFilterValues {
  q: string;
  type: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  sort: string;
  mode: string;
  origin: string;
  destination: string;
}

export function SearchFilters({
  initial,
  locale,
}: {
  initial: SearchFilterValues;
  locale: Locale;
}) {
  const router = useRouter();
  const dict = getDictionary(locale);
  const [values, setValues] = useState<SearchFilterValues>(initial);
  const [open, setOpen] = useState(false);

  function set<K extends keyof SearchFilterValues>(
    key: K,
    value: SearchFilterValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (values.q.trim()) params.set("q", values.q.trim());
    if (values.type) params.set("type", values.type);
    if (values.minPrice) params.set("minPrice", values.minPrice);
    if (values.maxPrice) params.set("maxPrice", values.maxPrice);
    if (values.minRating) params.set("minRating", values.minRating);
    if (values.sort) params.set("sort", values.sort);
    if (values.type === "transport") {
      if (values.mode) params.set("mode", values.mode);
      if (values.origin.trim()) params.set("origin", values.origin.trim());
      if (values.destination.trim())
        params.set("destination", values.destination.trim());
    }
    router.push(`/search?${params.toString()}`);
    setOpen(false);
  }

  function reset() {
    setValues({
      q: "",
      type: "",
      minPrice: "",
      maxPrice: "",
      minRating: "",
      sort: "",
      mode: "",
      origin: "",
      destination: "",
    });
    router.push("/search");
    setOpen(false);
  }

  const isTransport = values.type === "transport";

  const form = (
    <form onSubmit={apply} className="space-y-5">
      <Input
        label={t(dict, "nav.search")}
        placeholder={t(dict, "search.filter.searchPh")}
        value={values.q}
        onChange={(e) => set("q", e.target.value)}
      />

      <Select
        label={t(dict, "search.filter.type")}
        value={values.type}
        onChange={(e) => set("type", e.target.value)}
        options={[
          { value: "", label: t(dict, "search.filter.allTypes") },
          { value: "hotel", label: t(dict, "nav.hotels") },
          { value: "activity", label: t(dict, "nav.activities") },
          { value: "transport", label: t(dict, "nav.transport") },
        ]}
      />

      {isTransport && (
        <Select
          label={t(dict, "search.filter.mode")}
          value={values.mode}
          onChange={(e) => set("mode", e.target.value)}
          options={[
            { value: "", label: t(dict, "search.filter.modeAll") },
            { value: "flight", label: t(dict, "transport.mode.flight") },
            { value: "train", label: t(dict, "transport.mode.train") },
            { value: "bus", label: t(dict, "transport.mode.bus") },
            { value: "ferry", label: t(dict, "transport.mode.ferry") },
            { value: "transfer", label: t(dict, "transport.mode.transfer") },
          ]}
        />
      )}

      <div>
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          {t(dict, "search.filter.priceUsd")}
        </span>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            placeholder={t(dict, "search.filter.minPrice")}
            value={values.minPrice}
            onChange={(e) => set("minPrice", e.target.value)}
          />
          <span className="text-slate-400">–</span>
          <Input
            type="number"
            min={0}
            placeholder={t(dict, "search.filter.maxPrice")}
            value={values.maxPrice}
            onChange={(e) => set("maxPrice", e.target.value)}
          />
        </div>
      </div>

      <Select
        label={t(dict, "search.filter.rating")}
        value={values.minRating}
        onChange={(e) => set("minRating", e.target.value)}
        options={[
          { value: "", label: t(dict, "search.filter.ratingAny") },
          { value: "3", label: "3.0+" },
          { value: "4", label: "4.0+" },
          { value: "4.5", label: "4.5+" },
        ]}
      />

      <Select
        label={t(dict, "search.sort.label")}
        value={values.sort}
        onChange={(e) => set("sort", e.target.value)}
        options={[
          { value: "", label: t(dict, "search.sort.recommended") },
          { value: "price-asc", label: t(dict, "search.sort.priceAsc") },
          { value: "price-desc", label: t(dict, "search.sort.priceDesc") },
          { value: "rating", label: t(dict, "search.sort.rating") },
        ]}
      />

      <div className="flex gap-2 pt-1">
        <Button type="submit" fullWidth>
          {t(dict, "search.filter.apply")}
        </Button>
        <Button type="button" variant="outline" onClick={reset}>
          {t(dict, "search.filter.clear")}
        </Button>
      </div>
    </form>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="mb-4 lg:hidden">
        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={() => setOpen((v) => !v)}
        >
          {open
            ? t(dict, "search.filter.hide")
            : t(dict, "search.filter.toggle")}
        </Button>
      </div>

      {/* Mobile collapsible sheet */}
      <div
        className={cn(
          "mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-card lg:hidden",
          open ? "block" : "hidden",
        )}
      >
        {form}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-20 rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            {t(dict, "search.filters")}
          </h2>
          {form}
        </div>
      </aside>
    </>
  );
}
