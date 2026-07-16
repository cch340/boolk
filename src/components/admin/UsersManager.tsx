"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicUser } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { Button, Badge, Card } from "@/components/ui";
import { PageHeader, EmptyState } from "@/components/admin/PageHeader";

export interface AdminUser extends PublicUser {
  bookingCount: number;
}

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
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={u.active ? "success" : "neutral"}>
                      {u.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
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
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <Badge tone={u.role === "admin" ? "brand" : "neutral"}>
                  {u.role}
                </Badge>
                <span>{u.bookingCount} bookings</span>
                <span>· Joined {formatDate(u.createdAt)}</span>
              </div>
              <div className="mt-3">
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
    </div>
  );
}
