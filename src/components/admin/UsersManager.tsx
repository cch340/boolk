"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicUser, PointsTransaction, PointsReason } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { Button, Badge, Card, Modal, Input } from "@/components/ui";
import type { BadgeTone } from "@/components/ui";
import { PageHeader, EmptyState } from "@/components/admin/PageHeader";

export interface AdminUser extends PublicUser {
  bookingCount: number;
  pointsBalance: number;
  ledger: PointsTransaction[];
}

const REASON_TONES: Record<PointsReason, BadgeTone> = {
  earn: "success",
  redeem: "warning",
  "redeem-refund": "info",
  "earn-revoke": "danger",
  "admin-adjust": "brand",
};

export function UsersManager({
  users,
  currentUserId,
}: {
  users: AdminUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState<AdminUser | null>(null);
  const [ledgerUser, setLedgerUser] = useState<AdminUser | null>(null);

  async function toggle(u: AdminUser) {
    setBusyId(u.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !u.active }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to update user");
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (users.length === 0) {
    return (
      <div>
        <PageHeader title="Users" />
        <EmptyState title="No users yet" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Users" description={`${users.length} registered`} />

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <Card className="overflow-hidden">
        {/* Desktop table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Bookings</th>
                <th className="px-4 py-3 font-medium">Points</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {u.name}
                    {u.id === currentUserId && (
                      <span className="ml-2 text-xs font-normal text-slate-400">
                        (you)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge tone={u.role === "admin" ? "brand" : "neutral"}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.bookingCount}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="font-medium text-brand-600 hover:text-brand-700 hover:underline"
                      onClick={() => setLedgerUser(u)}
                      title="View points ledger"
                    >
                      {u.pointsBalance.toLocaleString("en-US")}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={u.active ? "success" : "neutral"}>
                      {u.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setError(null);
                          setAdjusting(u);
                        }}
                      >
                        Adjust points
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === u.id || u.id === currentUserId}
                        title={
                          u.id === currentUserId
                            ? "You cannot deactivate yourself"
                            : undefined
                        }
                        onClick={() => toggle(u)}
                      >
                        {u.active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <ul className="divide-y divide-slate-100 sm:hidden">
          {users.map((u) => (
            <li key={u.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">
                    {u.name}
                    {u.id === currentUserId && (
                      <span className="ml-1 text-xs font-normal text-slate-400">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="truncate text-sm text-slate-500">{u.email}</p>
                </div>
                <Badge tone={u.active ? "success" : "neutral"}>
                  {u.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <Badge tone={u.role === "admin" ? "brand" : "neutral"}>
                  {u.role}
                </Badge>
                <span>{u.bookingCount} bookings</span>
                <button
                  type="button"
                  className="font-medium text-brand-600 hover:underline"
                  onClick={() => setLedgerUser(u)}
                >
                  {u.pointsBalance.toLocaleString("en-US")} pts
                </button>
                <span>· Joined {formatDate(u.createdAt)}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  fullWidth
                  onClick={() => {
                    setError(null);
                    setAdjusting(u);
                  }}
                >
                  Adjust points
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  fullWidth
                  disabled={busyId === u.id || u.id === currentUserId}
                  onClick={() => toggle(u)}
                >
                  {u.id === currentUserId
                    ? "Cannot deactivate yourself"
                    : u.active
                      ? "Deactivate"
                      : "Activate"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <AdjustPointsModal
        user={adjusting}
        onClose={() => setAdjusting(null)}
        onDone={() => {
          setAdjusting(null);
          router.refresh();
        }}
      />

      <LedgerModal user={ledgerUser} onClose={() => setLedgerUser(null)} />
    </div>
  );
}

function AdjustPointsModal({
  user,
  onClose,
  onDone,
}: {
  user: AdminUser | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset fields when the target user changes.
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  if (user && user.id !== lastUserId) {
    setLastUserId(user.id);
    setDelta("");
    setNote("");
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    const parsed = Number(delta);
    if (!Number.isInteger(parsed) || parsed === 0) {
      setError("Delta must be a non-zero integer");
      return;
    }
    if (!note.trim()) {
      setError("A note is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta: parsed, note: note.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to adjust points");
        return;
      }
      onDone();
    } catch {
      setError("Network error while adjusting points");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={user !== null}
      onClose={onClose}
      title="Adjust points"
      className="sm:max-w-md"
    >
      {user && (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-slate-600">
            {user.name} · current balance{" "}
            <span className="font-medium text-slate-900">
              {user.pointsBalance.toLocaleString("en-US")}
            </span>{" "}
            pts
          </p>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <Input
            label="Delta (positive to grant, negative to deduct)"
            type="number"
            step="1"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            placeholder="e.g. 500 or -200"
          />
          <Input
            label="Note (required)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason for this adjustment"
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Apply adjustment"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function LedgerModal({
  user,
  onClose,
}: {
  user: AdminUser | null;
  onClose: () => void;
}) {
  return (
    <Modal
      open={user !== null}
      onClose={onClose}
      title={user ? `Points ledger — ${user.name}` : "Points ledger"}
      className="sm:max-w-lg"
    >
      {user && (
        <div>
          <p className="mb-3 text-sm text-slate-600">
            Balance{" "}
            <span className="font-medium text-slate-900">
              {user.pointsBalance.toLocaleString("en-US")}
            </span>{" "}
            pts · last {user.ledger.length} transactions
          </p>
          {user.ledger.length === 0 ? (
            <EmptyState title="No points activity" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {user.ledger.map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-start justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge tone={REASON_TONES[tx.reason]}>{tx.reason}</Badge>
                      <span className="text-xs text-slate-400">
                        {formatDate(tx.createdAt)}
                      </span>
                    </div>
                    {tx.note && (
                      <p className="mt-1 truncate text-sm text-slate-600">
                        {tx.note}
                      </p>
                    )}
                    {tx.bookingId && (
                      <p className="text-xs text-slate-400">{tx.bookingId}</p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 text-sm font-semibold ${
                      tx.delta >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {tx.delta >= 0 ? "+" : ""}
                    {tx.delta.toLocaleString("en-US")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Modal>
  );
}
