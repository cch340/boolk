"use client";

import { useState } from "react";
import type { Listing, ListingType, TransportMode, UnitLabel } from "@/lib/types";
import { Button, Input, Select } from "@/components/ui";
import { slugify } from "@/app/admin/_lib/status";
import { TRANSPORT_MODE_OPTIONS } from "@/app/admin/_lib/transport";

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
  // Transport fields (used iff type === 'transport').
  tMode: TransportMode;
  tOriginCity: string;
  tOriginCode: string;
  tDestinationCity: string;
  tDestinationCode: string;
  tCarrier: string;
  tServiceCode: string;
  tDepartureTime: string;
  tArrivalTime: string;
  tDurationMinutes: string;
}

function fromListing(l?: Listing): FormState {
  const t = l?.transport;
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
    tMode: t?.mode ?? "flight",
    tOriginCity: t?.originCity ?? "",
    tOriginCode: t?.originCode ?? "",
    tDestinationCity: t?.destinationCity ?? "",
    tDestinationCode: t?.destinationCode ?? "",
    tCarrier: t?.carrier ?? "",
    tServiceCode: t?.serviceCode ?? "",
    tDepartureTime: t?.departureTime ?? "",
    tArrivalTime: t?.arrivalTime ?? "",
    tDurationMinutes: t ? String(t.durationMinutes) : "",
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

  const isTransport = form.type === "transport";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const priceDollars = Number(form.priceDollars);
    if (!form.title.trim()) return setError("Title is required");
    if (!Number.isFinite(priceDollars) || priceDollars < 0)
      return setError("Enter a valid price");

    let transport: Record<string, unknown> | undefined;
    if (isTransport) {
      const required: Array<[string, string]> = [
        ["origin city", form.tOriginCity],
        ["origin code", form.tOriginCode],
        ["destination city", form.tDestinationCity],
        ["destination code", form.tDestinationCode],
        ["carrier", form.tCarrier],
        ["service code", form.tServiceCode],
        ["departure time", form.tDepartureTime],
        ["arrival time", form.tArrivalTime],
      ];
      const missing = required.find(([, v]) => !v.trim());
      if (missing) return setError(`Transport ${missing[0]} is required`);
      const duration = Number(form.tDurationMinutes);
      if (!Number.isInteger(duration) || duration <= 0)
        return setError("Enter a valid transport duration (minutes)");
      transport = {
        mode: form.tMode,
        originCity: form.tOriginCity.trim(),
        originCode: form.tOriginCode.trim(),
        destinationCity: form.tDestinationCity.trim(),
        destinationCode: form.tDestinationCode.trim(),
        carrier: form.tCarrier.trim(),
        serviceCode: form.tServiceCode.trim(),
        departureTime: form.tDepartureTime.trim(),
        arrivalTime: form.tArrivalTime.trim(),
        durationMinutes: duration,
      };
    }

    const payload = {
      type: form.type,
      title: form.title.trim(),
      slug: form.slug.trim(),
      // Transport keeps city synced to the origin city (server enforces too).
      city: isTransport ? form.tOriginCity.trim() : form.city.trim(),
      country: form.country.trim(),
      description: form.description.trim(),
      images: lines(form.images),
      pricePerUnitCents: Math.round(priceDollars * 100),
      unitLabel: isTransport ? "person" : form.unitLabel,
      rating: Number(form.rating) || 0,
      reviewCount: Number(form.reviewCount) || 0,
      maxGuests: Number(form.maxGuests) || 1,
      amenities: lines(form.amenities),
      highlights: lines(form.highlights),
      featured: form.featured,
      active: form.active,
      transport,
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
            onChange={(e) => {
              const nextType = e.target.value as ListingType;
              setForm((f) => ({
                ...f,
                type: nextType,
                // Transport is always per person.
                unitLabel: nextType === "transport" ? "person" : f.unitLabel,
              }));
            }}
            options={[
              { value: "hotel", label: "Hotel" },
              { value: "activity", label: "Activity" },
              { value: "transport", label: "Transport" },
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
            disabled={isTransport}
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
          label={isTransport ? "City (synced to origin)" : "City"}
          value={isTransport ? form.tOriginCity : form.city}
          disabled={isTransport}
          onChange={(e) => set("city", e.target.value)}
        />
        <Input
          label="Country"
          value={form.country}
          onChange={(e) => set("country", e.target.value)}
        />
      </div>

      {isTransport && (
        <fieldset className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <legend className="px-1 text-sm font-semibold text-slate-700">
            Transport details
          </legend>

          <div>
            <label className={labelCls} htmlFor="lf-tmode">
              Mode
            </label>
            <Select
              id="lf-tmode"
              value={form.tMode}
              onChange={(e) => set("tMode", e.target.value as TransportMode)}
              options={TRANSPORT_MODE_OPTIONS}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Origin city"
              value={form.tOriginCity}
              onChange={(e) => set("tOriginCity", e.target.value)}
              placeholder="Tokyo"
            />
            <Input
              label="Origin code"
              value={form.tOriginCode}
              onChange={(e) => set("tOriginCode", e.target.value)}
              placeholder="HND"
            />
            <Input
              label="Destination city"
              value={form.tDestinationCity}
              onChange={(e) => set("tDestinationCity", e.target.value)}
              placeholder="Singapore"
            />
            <Input
              label="Destination code"
              value={form.tDestinationCode}
              onChange={(e) => set("tDestinationCode", e.target.value)}
              placeholder="SIN"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Carrier"
              value={form.tCarrier}
              onChange={(e) => set("tCarrier", e.target.value)}
              placeholder="ANA"
            />
            <Input
              label="Service code"
              value={form.tServiceCode}
              onChange={(e) => set("tServiceCode", e.target.value)}
              placeholder="NH803"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Input
              label="Departure time"
              value={form.tDepartureTime}
              onChange={(e) => set("tDepartureTime", e.target.value)}
              placeholder="08:30"
            />
            <Input
              label="Arrival time"
              value={form.tArrivalTime}
              onChange={(e) => set("tArrivalTime", e.target.value)}
              placeholder="15:05"
            />
            <Input
              label="Duration (min)"
              type="number"
              min="1"
              value={form.tDurationMinutes}
              onChange={(e) => set("tDurationMinutes", e.target.value)}
              placeholder="455"
            />
          </div>
        </fieldset>
      )}

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
