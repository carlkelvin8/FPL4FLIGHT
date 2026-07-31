"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { SubscriptionRow } from "../repository";
import { deleteSubscription } from "../actions";
import { EditSubscriptionDialog } from "./edit-subscription-dialog";
import { ConfirmDialog } from "@/lib/components/confirm-dialog";
import { useToast } from "@/lib/components/toast";
import { useSort } from "@/lib/hooks/use-sort";
import { Pagination } from "@/lib/components/pagination";
import { BulkActionsBar } from "@/lib/components/bulk-actions";

interface Props {
  subscriptions: SubscriptionRow[];
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700 ring-1 ring-green-200",
  trialing: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  past_due: "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200",
  canceled: "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
  expired: "bg-red-100 text-red-700 ring-1 ring-red-200",
};

export function SubscriptionList({ subscriptions: initial }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState(initial);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingSub, setEditingSub] = useState<SubscriptionRow | null>(null);
  const [deletingSub, setDeletingSub] = useState<SubscriptionRow | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDelete, setBulkDelete] = useState(false);

  const { sorted, sort, toggle } = useSort(subscriptions, "created_at", "desc");

  const filtered = useMemo(() => {
    let result = sorted;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) => (s.user_name || "").toLowerCase().includes(q));
    }
    if (statusFilter) {
      result = result.filter((s) => s.status === statusFilter);
    }
    return result;
  }, [sorted, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const prevFilterKey = `${search}-${statusFilter}`;
  const [lastFilterKey, setLastFilterKey] = useState(prevFilterKey);
  if (prevFilterKey !== lastFilterKey) {
    setPage(1);
    setLastFilterKey(prevFilterKey);
  }

  async function handleDelete() {
    if (!deletingSub) return;
    setActionError(null);
    const result = await deleteSubscription(deletingSub.id);
    if (result.error) {
      setActionError(result.error);
      toast(result.error, "error");
    } else {
      setSubscriptions((prev) => prev.filter((s) => s.id !== deletingSub.id));
      setSelected((prev) => { const s = new Set(prev); s.delete(deletingSub.id); return s; });
      toast("Subscription deleted");
      router.refresh();
    }
    setDeletingSub(null);
  }

  const handleBulkDelete = async () => {
    let success = 0;
    for (const id of selected) {
      const result = await deleteSubscription(id);
      if (!result.error) success++;
    }
    setSubscriptions((prev) => prev.filter((s) => !selected.has(s.id)));
    toast(`${success} of ${selected.size} subscriptions deleted`);
    setSelected(new Set());
    setBulkDelete(false);
    router.refresh();
  };

  function handleSave(updated: SubscriptionRow) {
    setSubscriptions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setEditingSub(null);
    toast("Subscription updated");
    router.refresh();
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; });
  };

  const toggleAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map((s) => s.id)));
  };

  const sortIcon = (key: string) => {
    if (sort.key !== key) return null;
    return <span className="ml-1 inline-block">{sort.dir === "asc" ? "▲" : "▼"}</span>;
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-runway-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input type="text" placeholder="Search by user..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-runway-300 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm transition-colors focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-runway-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="trialing">Trialing</option>
          <option value="past_due">Past Due</option>
          <option value="canceled">Canceled</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {actionError && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{actionError}</div>
      )}

      <BulkActionsBar selectedCount={selected.size} onDeleteSelected={() => setBulkDelete(true)} onClear={() => setSelected(new Set())} />

      <div className="overflow-hidden rounded-2xl border border-runway-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-runway-200">
            <thead className="bg-runway-50">
              <tr>
                <th className="w-10 px-4 py-3.5 text-left">
                  <input type="checkbox" checked={paginated.length > 0 && selected.size === paginated.length} onChange={toggleAll} className="rounded border-runway-300 text-brand-600 focus:ring-brand-500" />
                </th>
                <th className="cursor-pointer px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-runway-500 hover:text-runway-900" onClick={() => toggle("user_name")}>
                  User{sortIcon("user_name")}
                </th>
                <th className="cursor-pointer px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-runway-500 hover:text-runway-900" onClick={() => toggle("plan")}>
                  Plan{sortIcon("plan")}
                </th>
                <th className="cursor-pointer px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-runway-500 hover:text-runway-900" onClick={() => toggle("status")}>
                  Status{sortIcon("status")}
                </th>
                <th className="cursor-pointer px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-runway-500 hover:text-runway-900" onClick={() => toggle("current_period_end")}>
                  Period End{sortIcon("current_period_end")}
                </th>
                <th className="cursor-pointer px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-runway-500 hover:text-runway-900" onClick={() => toggle("created_at")}>
                  Created{sortIcon("created_at")}
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-runway-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-runway-100">
              {paginated.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-runway-400">
                  {search || statusFilter ? "No subscriptions match." : "No subscriptions yet."}
                </td></tr>
              )}
              {paginated.map((sub) => (
                <tr key={sub.id} className="transition-colors hover:bg-runway-50">
                  <td className="px-4 py-3.5">
                    <input type="checkbox" checked={selected.has(sub.id)} onChange={() => toggleSelect(sub.id)} className="rounded border-runway-300 text-brand-600 focus:ring-brand-500" />
                  </td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-runway-900">
                    {sub.user_name || <span className="font-mono text-runway-400">{sub.user_id.slice(0, 8)}…</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${sub.plan === "annual" ? "bg-purple-100 text-purple-700 ring-1 ring-purple-200" : "bg-brand-100 text-brand-700 ring-1 ring-brand-200"}`}>
                      {sub.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[sub.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {sub.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-runway-500">
                    {new Date(sub.current_period_end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-runway-500">
                    {new Date(sub.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingSub(sub)} className="rounded-lg border border-runway-300 px-3 py-1.5 text-xs font-medium text-runway-700 transition-colors hover:bg-runway-50 hover:border-runway-400">Edit</button>
                      <button onClick={() => setDeletingSub(sub)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      </div>

      {editingSub && (
        <EditSubscriptionDialog subscription={editingSub} onClose={() => setEditingSub(null)} onSave={handleSave} />
      )}

      {deletingSub && (
        <ConfirmDialog title="Delete Subscription" message="Are you sure you want to delete this subscription?" onConfirm={handleDelete} onCancel={() => setDeletingSub(null)} />
      )}

      {bulkDelete && (
        <ConfirmDialog title="Delete Selected" message={`Delete ${selected.size} subscriptions?`} confirmLabel={`Delete ${selected.size}`} onConfirm={handleBulkDelete} onCancel={() => setBulkDelete(false)} />
      )}
    </div>
  );
}
