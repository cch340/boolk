import { bookings, users } from "@/lib/db";
import { toPublicUser, getSessionUser } from "@/lib/auth";
import { UsersManager, type AdminUser } from "@/components/admin/UsersManager";

export default async function AdminUsersPage() {
  const admin = await getSessionUser();

  const counts = bookings.list().reduce<Record<string, number>>((acc, b) => {
    acc[b.userId] = (acc[b.userId] ?? 0) + 1;
    return acc;
  }, {});

  const rows: AdminUser[] = users
    .list()
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    .map((u) => ({ ...toPublicUser(u), bookingCount: counts[u.id] ?? 0 }));

  return <UsersManager users={rows} currentUserId={admin?.id ?? ""} />;
}
