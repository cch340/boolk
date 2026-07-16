"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Review } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { Button, Badge, Card, StarRating } from "@/components/ui";
import { PageHeader, EmptyState } from "@/components/admin/PageHeader";
import { reviewTone } from "@/app/admin/_lib/status";

export interface AdminReview extends Review {
  listingTitle: string;
  userName: string;
  userEmail: string;
}

export function ReviewsManager({ reviews }: { reviews: AdminReview[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(r: AdminReview) {
    setBusyId(r.id);
    setError(null);
    const next = r.status === "visible" ? "hidden" : "visible";
    try {
      const res = await fetch(`/api/admin/reviews/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to update review");
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader title="Reviews" description={`${reviews.length} total`} />

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {reviews.length === 0 ? (
        <EmptyState title="No reviews yet" />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900">
                      {r.listingTitle}
                    </span>
                    <Badge tone={reviewTone(r.status)}>{r.status}</Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <StarRating value={r.rating} size="sm" />
                    <span className="text-xs text-slate-400">
                      {r.userName} · {formatDate(r.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{r.text}</p>
                </div>
                <div className="shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === r.id}
                    onClick={() => toggle(r)}
                  >
                    {r.status === "visible" ? "Hide" : "Show"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
