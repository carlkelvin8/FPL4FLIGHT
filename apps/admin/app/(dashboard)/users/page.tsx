import type { Metadata } from "next";

import { supabaseConfigured } from "@/lib/supabase/server";
import { UsersRepository } from "@/features/users";
import { formatDate, shortId } from "@/lib/format";

export const metadata: Metadata = {
  title: "Users",
};

export default async function UsersPage() {
  if (!supabaseConfigured()) {
    return (
      <section>
        <h1 className="text-2xl font-semibold text-runway-900">Users</h1>
        <p className="mt-4 text-sm text-runway-500">
          Configure Supabase environment variables to manage users.
        </p>
      </section>
    );
  }

  let profiles: Awaited<ReturnType<UsersRepository["list"]>>;
  try {
    profiles = await new UsersRepository().list();
  } catch {
    return (
      <section>
        <h1 className="text-2xl font-semibold text-runway-900">Users</h1>
        <p className="mt-4 text-sm text-red-700" role="alert">
          Failed to load users. Check that your Supabase connection is healthy.
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-runway-900">Users</h1>
        <span className="text-sm text-runway-500">{profiles.length} profiles</span>
      </div>

      <div className="overflow-hidden rounded-lg border border-runway-200">
        <table className="min-w-full divide-y divide-runway-200">
          <thead className="bg-runway-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Joined</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-runway-100 bg-white">
            {profiles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-runway-500">
                  No users yet.
                </td>
              </tr>
            )}
            {profiles.map((profile) => (
              <tr key={profile.id} className="transition-colors hover:bg-runway-50">
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-runway-900">
                  {profile.full_name || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {profile.role === "admin" ? (
                    <span className="inline-flex rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-runway-100 px-2.5 py-0.5 text-xs font-medium text-runway-700">
                      Pilot
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-runway-600">
                  {formatDate(profile.created_at)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-runway-500">
                  {shortId(profile.id)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
