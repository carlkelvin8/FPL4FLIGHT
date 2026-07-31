import type { Metadata } from "next";

import { supabaseConfigured } from "@/lib/supabase/server";
import { AuditLogRepository } from "@/features/audit";
import { formatDateTime, humanize, shortId } from "@/lib/format";

export const metadata: Metadata = {
  title: "Audit Log",
};

export default async function AuditPage() {
  if (!supabaseConfigured()) {
    return (
      <section>
        <h1 className="text-2xl font-semibold text-runway-900">Audit Log</h1>
        <p className="mt-4 text-sm text-runway-500">
          Configure Supabase environment variables to view the audit log.
        </p>
      </section>
    );
  }

  let entries: Awaited<ReturnType<AuditLogRepository["list"]>>;
  try {
    entries = await new AuditLogRepository().list();
  } catch {
    return (
      <section>
        <h1 className="text-2xl font-semibold text-runway-900">Audit Log</h1>
        <p className="mt-4 text-sm text-red-700" role="alert">
          Failed to load audit entries. Check that your Supabase connection is healthy.
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-runway-900">Audit Log</h1>
        <span className="text-sm text-runway-500">{entries.length} recent entries</span>
      </div>

      <div className="overflow-hidden rounded-lg border border-runway-200">
        <table className="min-w-full divide-y divide-runway-200">
          <thead className="bg-runway-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Action</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Resource</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Resource ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-runway-100 bg-white">
            {entries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-runway-500">
                  No audit entries recorded yet.
                </td>
              </tr>
            )}
            {entries.map((entry) => (
              <tr key={entry.id} className="transition-colors hover:bg-runway-50">
                <td className="whitespace-nowrap px-4 py-3 text-sm text-runway-600">
                  {formatDateTime(entry.created_at)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-runway-900">
                  {humanize(entry.action)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-runway-600">
                  {humanize(entry.resource)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-runway-500">
                  {shortId(entry.resource_id)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-runway-500">
                  {shortId(entry.user_id)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-runway-500">
                  {entry.ip_address ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
