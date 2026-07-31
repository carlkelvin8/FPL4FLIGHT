import { UserList } from "@/features/users/components/user-list";
import { UserRepository } from "@/features/users";

export default async function UsersPage() {
  let users = await new UserRepository().list().catch(() => []);

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Total Users</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{users.length}</p>
        </div>
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Pilots</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{users.filter((u) => u.role === "pilot").length}</p>
        </div>
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Admins</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{users.filter((u) => u.role === "admin").length}</p>
        </div>
      </div>

      <UserList users={users} />
    </section>
  );
}
