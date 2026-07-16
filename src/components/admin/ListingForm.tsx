"use client";

import { useState } from "react";
import type { Listing, ListingType, UnitLabel } from "@/lib/types";
import { Button, Input, Select } from "@/components/ui";
import { slugify } from "@/app/admin/_lib/status";

interface FormState {
  type: ListingType;
  title: string;
  slug: string;
  city: string;
  country: string;
  description: string;
  images: string;
  priceDollars: string;
  unitLabel: UnitLabel;
  rating: string;
  reviewCount: string;
  maxGuests: string;
  amenities: string;
  highlights: string;
  featured: boolean;
  active: boolean;
}

function fromListing(l?: Listing): FormState {
  return {
    type: l?.type ?? "hotel",
    title: l?.title ?? "",
    slug: l?.slug ?? "",
    city: l?.city ?? "",
    country: l?.country ?? "",
    description: l?.description ?? "",
    images: (l?.images ?? []).join("\n"),
    priceDollars: l ? (l.pricePerUnitCents / 100).toString() : "",
    unitLabel: l?.unitLabel ?? "night",
    rating: l ? String(l.rating) : "4.5",
    reviewCount: l ? String(l.reviewCount) : "0",
    maxGuests: l ? String(l.maxGuests) : "2",
    amenities: (l?.amenities ?? []).join("\n"),
    highlights: (l?.highlights ?? []).join("\n"),
    featured: l?.featured ?? false,
    active: l?.active ?? true,
  };
}

function lines(v: string): string[] {
  return v
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

const labelCls = "mb-1.5 block text-sm font-medium text-slate-700";
const textareaCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function ListingForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: Listing;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState<FormState>(() => fromListing(initial));
  const [slugEdited, setSlugEdited] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onTitleChange(value: string) {
    setForm((f) => ({
      ...f,
      title: value,
      slug: slugEdited ? f.slug : slugify(value),
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const priceDollars = Number(form.priceDollars);
    if (!form.title.trim()) return setError("Title is required");
    if (!Number.isFinite(priceDollars) || priceDollars < 0)
      return setError("Enter a valid price");

    const payload = {
      type: form.type,
      title: form.title.trim(),
      slug: form.slug.trim(),
      city: form.city.trim(),
      country: form.country.trim(),
      description: form.description.trim(),
      images: lines(form.images),
      pricePerUnitCents: Math.round(priceDollars * 100),
      unitLabel: form.unitLabel,
      rating: Number(form.rating) || 0,
      reviewCount: Number(form.reviewCount) || 0,
      maxGuests: Number(form.maxGuests) || 1,
      amenities: lines(form.amenities),
      highlights: lines(form.highlights),
      featured: form.featured,
      active: form.active,
    };

    setSaving(true);
    try {
      const res = await fetch(
        isEdit ? `/api/admin/listings/${initial!.id}` : "/api/admin/listings",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to save listing");
        return;
      }
      onSaved();
    } catch {
      setError("Network error while saving");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="lf-type">
            Type
          </label>
          <Select
            id="lf-type"
            value={form.type}
            onChange={(e) => set("type", e.target.value as ListingType)}
            options={[
              { value: "hotel", label: "Hotel" },
              { value: "activity", label: "Activity" },
            ]}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="lf-unit">
            Unit label
          </label>
          <Select
            id="lf-unit"
            value={form.unitLabel}
            onChange={(e) => set("unitLabel", e.target.value as UnitLabel)}
            options={[
              { value: "night", label: "Per night" },
              { value: "person", label: "Per person" },
            ]}
          />
        </div>
      </div>

      <Input
        label="Title"
        value={form.title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Shinjuku Skyline Hotel"
      />

      <Input
        label="Slug"
        value={form.slug}
        onChange={(e) => {
          setSlugEdited(true);
          set("slug", e.target.value);
        }}
        placeholder="shinjuku-skyline-hotel"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="City"
          value={form.city}
          onChange={(e) => set("city", e.target.value)}
        />
        <Input
          label="Country"
          value={form.country}
          onChange={(e) => set("country", e.target.value)}
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="lf-desc">
          Description
        </label>
        <textarea
          id="lf-desc"
          rows={3}
          className={textareaCls}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Input
          label="Price (USD)"
          type="number"
          min="0"
          step="0.01"
          value={form.priceDollars}
          onChange={(e) => set("priceDollars", e.target.value)}
        />
        <Input
          label="Rating"
          type="number"
          min="0"
          max="5"
          step="0.1"
          value={form.rating}
          onChange={(e) => set("rating", e.target.value)}
        />
        <Input
          label="Reviews"
          type="number"
          min="0"
          value={form.reviewCount}
          onChange={(e) => set("reviewCount", e.target.value)}
        />
        <Input
          label="Max guests"
          type="number"
          min="1"
          value={form.maxGuests}
          onChange={(e) => set("maxGuests", e.target.value)}
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="lf-images">
          Images (one URL per line)
        </label>
        <textarea
          id="lf-images"
          rows={3}
          className={textareaCls}
          value={form.images}
          onChange={(e) => set("images", e.target.value)}
          placeholder="https://picsum.photos/seed/example-1/800/600"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="lf-amenities">
            Amenities (one per line)
          </label>
          <textarea
            id="lf-amenities"
            rows={3}
            className={textareaCls}
            value={form.amenities}
            onChange={(e) => set("amenities", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="lf-highlights">
            Highlights (one per line)
          </label>
          <textarea
            id="lf-highlights"
            rows={3}
            className={textareaCls}
            value={form.highlights}
            onChange={(e) => set("highlights", e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            checked={form.featured}
            onChange={(e) => set("featured", e.target.checked)}
          />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            checked={form.active}
            onChange={(e) => set("active", e.target.checked)}
          />
          Active
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create listing"}
        </Button>
      </div>
    </form>
  );
}
