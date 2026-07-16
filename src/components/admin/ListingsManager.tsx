"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Listing, ListingType } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import {
  Button,
  Input,
  Select,
  Badge,
  Card,
  Modal,
  StarRating,
} from "@/components/ui";
import { PageHeader, EmptyState } from "@/components/admin/PageHeader";
import { ListingForm } from "@/components/admin/ListingForm";

type Editing = { mode: "new" } | { mode: "edit"; listing: Listing } | null;

export function ListingsManager({
  listings,
  bookingCounts,
}: {
  listings: Listing[];
  bookingCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | ListingType>("all");
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Listing | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((l) => {
      if (type !== "all" && l.type !== type) return false;
      if (!q) return true;
      return [l.title, l.city, l.country].some((f) =>
        f.toLowerCase().includes(q),
      );
    });
  }, [listings, query, type]);

  async function toggleActive(l: Listing) {
    setBusyId(l.id);
    setError(null);
    try {
      await fetch(`/api/admin/listings/${l.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !l.active }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusyId(deleting.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/listings/${deleting.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to delete listing");
        return;
      }
      setDeleting(null);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Listings"
        description={`${listings.length} total`}
        actions={
          <Button onClick={() => setEditing({ mode: "new" })}>
            New listing
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="sm:max-w-xs sm:flex-1">
          <Input
            placeholder="Search title or city…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="sm:w-40">
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as "all" | ListingType)}
            options={[
              { value: "all", label: "All types" },
              { value: "hotel", label: "Hotels" },
              { value: "activity", label: "Activities" },
            ]}
          />
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title="No listings match"
          description="Try clearing the search or filter."
        />
      ) : (
        <Card className="overflow-hidden">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Listing</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">City</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Thumb listing={l} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium text-slate-900">
                              {l.title}
                            </span>
                            {l.featured && <Badge tone="warning">Featured</Badge>}
                          </div>
                          <div className="text-xs text-slate-400">{l.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600">
                      {l.type}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{l.city}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {formatPrice(l.pricePerUnitCents)}
                      <span className="text-xs font-normal text-slate-400">
                        /{l.unitLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StarRating value={l.rating} size="sm" showValue />
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={l.active ? "success" : "neutral"}>
                        {l.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <RowActions
                        listing={l}
                        busy={busyId === l.id}
                        onEdit={() => setEditing({ mode: "edit", listing: l })}
                        onToggle={() => toggleActive(l)}
                        onDelete={() => {
                          setError(null);
                          setDeleting(l);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile / tablet cards */}
          <ul className="divide-y divide-slate-100 lg:hidden">
            {filtered.map((l) => (
              <li key={l.id} className="p-4">
                <div className="flex gap-3">
                  <Thumb listing={l} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate font-medium text-slate-900">
                        {l.title}
                      </span>
                      <Badge tone={l.active ? "success" : "neutral"}>
                        {l.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                      <span className="capitalize">{l.type}</span> · {l.city}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-sm font-medium text-slate-900">
                        {formatPrice(l.pricePerUnitCents)}/{l.unitLabel}
                      </span>
                      <StarRating value={l.rating} size="sm" showValue />
                      {l.featured && <Badge tone="warning">Featured</Badge>}
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <RowActions
                    listing={l}
                    busy={busyId === l.id}
                    onEdit={() => setEditing({ mode: "edit", listing: l })}
                    onToggle={() => toggleActive(l)}
                    onDelete={() => {
                      setError(null);
                      setDeleting(l);
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Create / edit modal */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.mode === "edit" ? "Edit listing" : "New listing"}
        className="sm:max-w-2xl"
      >
        {editing && (
          <ListingForm
            initial={editing.mode === "edit" ? editing.listing : undefined}
            onSaved={() => {
              setEditing(null);
              router.refresh();
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete listing"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            {deleting && (bookingCounts[deleting.id] ?? 0) > 0 ? (
              <Button
                variant="secondary"
                disabled={busyId === deleting?.id}
                onClick={() => {
                  if (deleting) toggleActive(deleting);
                  setDeleting(null);
                }}
              >
                Deactivate instead
              </Button>
            ) : (
              <Button
                variant="danger"
                disabled={busyId === deleting?.id}
                onClick={confirmDelete}
              >
                Delete
              </Button>
            )}
          </div>
        }
      >
        {deleting && (
          <p className="text-sm text-slate-600">
            {(bookingCounts[deleting.id] ?? 0) > 0 ? (
              <>
                <span className="font-medium text-slate-900">
                  {deleting.title}
                </span>{" "}
                has {bookingCounts[deleting.id]} booking
                {bookingCounts[deleting.id] === 1 ? "" : "s"} and cannot be
                deleted. You can deactivate it to hide it from the site.
              </>
            ) : (
              <>
                Permanently delete{" "}
                <span className="font-medium text-slate-900">
                  {deleting.title}
                </span>
                ? This cannot be undone.
              </>
            )}
          </p>
        )}
      </Modal>
    </div>
  );
}

function Thumb({ listing }: { listing: Listing }) {
  const src = listing.images[0];
  if (!src) {
    return <div className="h-12 w-12 shrink-0 rounded-lg bg-slate-100" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={listing.title}
      className="h-12 w-12 shrink-0 rounded-lg object-cover"
    />
  );
}

function RowActions({
  listing,
  busy,
  onEdit,
  onToggle,
  onDelete,
}: {
  listing: Listing;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button size="sm" variant="outline" onClick={onEdit} disabled={busy}>
        Edit
      </Button>
      <Button size="sm" variant="ghost" onClick={onToggle} disabled={busy}>
        {listing.active ? "Deactivate" : "Activate"}
      </Button>
      <Button size="sm" variant="ghost" onClick={onDelete} disabled={busy}>
        Delete
      </Button>
    </div>
  );
}
