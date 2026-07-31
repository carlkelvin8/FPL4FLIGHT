import type { Metadata } from "next";

import { supabaseConfigured } from "@/lib/supabase/server";
import { AnalyticsRepository } from "@/features/analytics";
import type { DashboardCounts } from "@/features/analytics";
import { formatDateTime, humanize, shortId } from "@/lib/format";

export const metadata: Metadata = {
  title: "Dashboard",
};

const statCards: Array<{ key: keyof DashboardCounts; label: string }> = [
  { key: "users", label: "Users" },
  { key: "aircraft", label: "Aircraft" },
  { key: "formTemplates", label: "Form Templates" },
  { key: "formInstances", label: "Forms Submitted" },
  { key: "subscriptions", label: "Subscriptions" },
  { key: "auditEvents", label: "Audit Events" },
];

export default async function DashboardPage() {
  if (!supabaseConfigured()) {
    return (
      <section>
        <h1 className="text-2xl font-semibold text-runway-900">Overview</h1>
        <p className="mt-2 text-sm text-runway-500">
          Configure Supabase environment variables to view dashboard analytics.
        </p>
      </section>
    );
  }

  let counts: Awaited<ReturnType<AnalyticsRepository["getCounts"]>>;
  let recentAudit: Awaited<ReturnType<AnalyticsRepository["getRecentAudit"]>>;
  try {
    const repo = new AnalyticsRepository();
    [counts, recentAudit] = await Promise.all([repo.getCounts(), repo.getRecentAudit()]);
  } catch {
    return (
      <section>
        <h1 className="text-2xl font-semibold text-runway-900">Overview</h1>
        <p className="mt-4 text-sm text-red-700" role="alert">
          Failed to load dashboard data. Check that your Supabase connection is healthy.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold text-runway-900">Overview</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="rounded-xl border border-runway-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-runway-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-runway-900">
              {counts[card.key]}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-runway-900">Recent Activity</h2>
        <div className="overflow-hidden rounded-lg border border-runway-200">
          <table className="min-w-full divide-y divide-runway-200">
            <thead className="bg-runway-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Resource</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-runway-100 bg-white">
              {recentAudit.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-runway-500">
                    No audit activity recorded yet.
                  </td>
                </tr>
              )}
              {recentAudit.map((event) => (
                <tr key={event.id} className="transition-colors hover:bg-runway-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-runway-600">
                    {formatDateTime(event.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-runway-900">
                    {humanize(event.action)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-runway-600">
                    {humanize(event.resource)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-runway-500">
                    {shortId(event.user_id)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-runway-500">
                    {event.ip_address ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
