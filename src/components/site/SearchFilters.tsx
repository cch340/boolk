"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select } from "@/components/ui";
import { cn } from "@/lib/cn";

export interface SearchFilterValues {
  q: string;
  type: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  sort: string;
}

export function SearchFilters({ initial }: { initial: SearchFilterValues }) {
  const router = useRouter();
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
    });
    router.push("/search");
    setOpen(false);
  }

  const form = (
    <form onSubmit={apply} className="space-y-5">
      <Input
        label="Search"
        placeholder="City or keyword"
        value={values.q}
        onChange={(e) => set("q", e.target.value)}
      />

      <Select
        label="Type"
        value={values.type}
        onChange={(e) => set("type", e.target.value)}
        options={[
          { value: "", label: "All types" },
          { value: "hotel", label: "Hotels" },
          { value: "activity", label: "Activities" },
        ]}
      />

      <div>
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          Price range (USD)
        </span>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            placeholder="Min"
            value={values.minPrice}
            onChange={(e) => set("minPrice", e.target.value)}
          />
          <span className="text-slate-400">–</span>
          <Input
            type="number"
            min={0}
            placeholder="Max"
            value={values.maxPrice}
            onChange={(e) => set("maxPrice", e.target.value)}
          />
        </div>
      </div>

      <Select
        label="Minimum rating"
        value={values.minRating}
        onChange={(e) => set("minRating", e.target.value)}
        options={[
          { value: "", label: "Any rating" },
          { value: "3", label: "3.0+" },
          { value: "4", label: "4.0+" },
          { value: "4.5", label: "4.5+" },
        ]}
      />

      <Select
        label="Sort by"
        value={values.sort}
        onChange={(e) => set("sort", e.target.value)}
        options={[
          { value: "", label: "Recommended" },
          { value: "price-asc", label: "Price: low to high" },
          { value: "price-desc", label: "Price: high to low" },
          { value: "rating", label: "Highest rated" },
        ]}
      />

      <div className="flex gap-2 pt-1">
        <Button type="submit" fullWidth>
          Apply
        </Button>
        <Button type="button" variant="outline" onClick={reset}>
          Reset
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
          {open ? "Hide filters" : "Filters & sort"}
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
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Filters</h2>
          {form}
        </div>
      </aside>
    </>
  );
}
