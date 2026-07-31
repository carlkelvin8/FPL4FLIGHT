import type { Metadata } from "next";

import { supabaseConfigured } from "@/lib/supabase/server";
import { SubscriptionsRepository } from "@/features/subscriptions";
import { formatDate, formatDateTime, shortId } from "@/lib/format";

export const metadata: Metadata = {
  title: "Subscriptions",
};

const statusStyles: Record<string, string> = {
  trialing: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  past_due: "bg-orange-100 text-orange-700",
  canceled: "bg-runway-100 text-runway-700",
  expired: "bg-red-100 text-red-700",
};

function statusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

export default async function SubscriptionsPage() {
  if (!supabaseConfigured()) {
    return (
      <section>
        <h1 className="text-2xl font-semibold text-runway-900">Subscriptions</h1>
        <p className="mt-4 text-sm text-runway-500">
          Configure Supabase environment variables to manage subscriptions.
        </p>
      </section>
    );
  }

  let rows: Awaited<ReturnType<SubscriptionsRepository["list"]>>;
  let summary: Awaited<ReturnType<SubscriptionsRepository["summary"]>>;
  try {
    const repo = new SubscriptionsRepository();
    [rows, summary] = await Promise.all([repo.list(), repo.summary()]);
  } catch {
    return (
      <section>
        <h1 className="text-2xl font-semibold text-runway-900">Subscriptions</h1>
        <p className="mt-4 text-sm text-red-700" role="alert">
          Failed to load subscriptions. Check that your Supabase connection is healthy.
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-runway-900">Subscriptions</h1>
        <span className="text-sm text-runway-500">{rows.length} subscriptions</span>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {Object.entries(summary).map(([status, count]) => (
          <div
            key={status}
            className="rounded-xl border border-runway-200 bg-white px-4 py-3 shadow-sm"
          >
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status] ?? "bg-runway-100 text-runway-700"}`}>
              {statusLabel(status)}
            </span>
            <span className="ml-2 text-xl font-bold text-runway-900">{count}</span>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-runway-200">
        <table className="min-w-full divide-y divide-runway-200">
          <thead className="bg-runway-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Plan</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Period End</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Started</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-runway-100 bg-white">
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-runway-500">
                  No subscriptions yet.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-runway-50">
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-runway-900">
                  {row.profiles?.full_name || shortId(row.user_id)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[row.status] ?? "bg-runway-100 text-runway-700"}`}>
                    {statusLabel(row.status)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm capitalize text-runway-700">
                  {row.plan}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-runway-600">
                  {formatDateTime(row.current_period_end)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-runway-600">
                  {formatDate(row.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
