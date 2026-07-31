"use client";

import { useState, useMemo, useEffect } from "react";
import { useSort } from "@/lib/hooks/use-sort";
import { Pagination } from "@/lib/components/pagination";
import { ErrorState } from "@/lib/components/error-state";
import { BulkActionsBar } from "@/lib/components/bulk-actions";
import { ConfirmDialog } from "@/lib/components/confirm-dialog";
import { useToast } from "@/lib/components/toast";

const ACTION_STYLES: Record<string, string> = {
  "form.submit": "bg-green-100 text-green-700 ring-1 ring-green-200",
  "form.draft_save": "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200",
  "template.publish": "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  "template.update": "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  "template.create": "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  "template.delete": "bg-red-100 text-red-700 ring-1 ring-red-200",
  "auth.sign_in": "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
  "auth.sign_out": "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
  "user.suspend": "bg-red-100 text-red-700 ring-1 ring-red-200",
  "user.update": "bg-purple-100 text-purple-700 ring-1 ring-purple-200",
  "user.delete": "bg-red-100 text-red-700 ring-1 ring-red-200",
  "subscription.upgrade": "bg-purple-100 text-purple-700 ring-1 ring-purple-200",
  "subscription.update": "bg-purple-100 text-purple-700 ring-1 ring-purple-200",
  "subscription.delete": "bg-red-100 text-red-700 ring-1 ring-red-200",
  "aircraft.create": "bg-teal-100 text-teal-700 ring-1 ring-teal-200",
  "aircraft.delete": "bg-red-100 text-red-700 ring-1 ring-red-200",
  "INSERT": "bg-green-100 text-green-700 ring-1 ring-green-200",
  "UPDATE": "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  "DELETE": "bg-red-100 text-red-700 ring-1 ring-red-200",
};

const ACTION_CATEGORIES = [
  { value: "", label: "All actions" },
  { value: "form", label: "Form submissions" },
  { value: "template", label: "Template changes" },
  { value: "auth", label: "Auth events" },
  { value: "user", label: "User management" },
  { value: "subscription", label: "Subscription changes" },
  { value: "aircraft", label: "Aircraft changes" },
];

function exportCSV(logs: any[]) {
  const headers = ["Timestamp", "User", "Action", "Resource", "Resource ID", "IP Address"];
  const rows = logs.map((l) => [
    new Date(l.created_at).toISOString(),
    l.user_name || "System",
    l.action,
    l.resource,
    l.resource_id || "",
    l.ip_address || "",
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AuditPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [bulkDelete, setBulkDelete] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/v1/audit")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setLogs(Array.isArray(data) ? data : data.data ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load audit logs"))
      .finally(() => setLoading(false));
  }, []);

  const { sorted, sort, toggle } = useSort(logs, "created_at", "desc");

  const filtered = useMemo(() => {
    let result = sorted;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((l) =>
        (l.user_name || "").toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.resource.toLowerCase().includes(q) ||
        (l.resource_id || "").toLowerCase().includes(q)
      );
    }
    if (actionFilter) {
      result = result.filter((l) => l.action.startsWith(actionFilter));
    }
    return result;
  }, [sorted, search, actionFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [search, actionFilter]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/audit?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setLogs((prev) => prev.filter((l) => l.id !== id));
      setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
      toast("Audit log entry deleted");
    } catch {
      toast("Failed to delete audit entry", "error");
    }
    setDeleteTarget(null);
  };

  const handleBulkDelete = async () => {
    let success = 0;
    for (const id of selected) {
      try {
        const res = await fetch(`/api/v1/audit?id=${id}`, { method: "DELETE" });
        if (res.ok) success++;
      } catch {}
    }
    setLogs((prev) => prev.filter((l) => !selected.has(l.id)));
    toast(`${success} of ${selected.size} entries deleted`);
    setSelected(new Set());
    setBulkDelete(false);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; });
  };

  const toggleAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map((l) => l.id)));
  };

  const sortIcon = (key: string) => {
    if (sort.key !== key) return null;
    return <span className="ml-1 inline-block">{sort.dir === "asc" ? "▲" : "▼"}</span>;
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-runway-900">Audit Log</h1>
          <p className="mt-1 text-sm text-runway-500">Track all form submissions, template changes, and account activity.</p>
        </div>
        <button onClick={() => exportCSV(filtered)} className="flex items-center gap-2 rounded-xl border border-runway-300 bg-white px-4 py-2.5 text-sm font-medium text-runway-700 transition-colors hover:bg-runway-50">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-runway-300 border-t-brand-500" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
              className="rounded-xl border border-runway-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400">
              {ACTION_CATEGORIES.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
            </select>
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-runway-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input type="text" placeholder="Search audit log..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-runway-300 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm transition-colors focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400" />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-runway-200 bg-white">
            <BulkActionsBar selectedCount={selected.size} onDeleteSelected={() => setBulkDelete(true)} onClear={() => setSelected(new Set())} />

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-runway-200">
                <thead className="bg-runway-50">
                  <tr>
                    <th className="w-10 px-4 py-3.5 text-left"><input type="checkbox" checked={paginated.length > 0 && selected.size === paginated.length} onChange={toggleAll} className="rounded border-runway-300 text-brand-600 focus:ring-brand-500" /></th>
                    <th className="cursor-pointer px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-runway-500 hover:text-runway-900" onClick={() => toggle("created_at")}>Timestamp{sortIcon("created_at")}</th>
                    <th className="cursor-pointer px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-runway-500 hover:text-runway-900" onClick={() => toggle("user_name")}>User{sortIcon("user_name")}</th>
                    <th className="cursor-pointer px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-runway-500 hover:text-runway-900" onClick={() => toggle("action")}>Action{sortIcon("action")}</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-runway-500">Details</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-runway-500">IP</th>
                    <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-runway-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-runway-100">
                  {paginated.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-runway-400">
                      {search || actionFilter ? "No entries match." : "No audit logs yet."}
                    </td></tr>
                  )}
                  {paginated.map((log) => (
                    <tr key={log.id} className="transition-colors hover:bg-runway-50">
                      <td className="px-4 py-3.5"><input type="checkbox" checked={selected.has(log.id)} onChange={() => toggleSelect(log.id)} className="rounded border-runway-300 text-brand-600 focus:ring-brand-500" /></td>
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-runway-500">
                        {new Date(log.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-runway-900">{log.user_name || "System"}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${ACTION_STYLES[log.action] ?? "bg-gray-100 text-gray-600"}`}>{log.action}</span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-runway-600">{log.resource_id ? `${log.resource} #${log.resource_id}` : log.resource}</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-runway-400">{log.ip_address || "—"}</td>
                      <td className="px-4 py-3.5 text-right">
                        <button onClick={() => setDeleteTarget(log.id)} className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
          </div>
        </>
      )}

      {deleteTarget && <ConfirmDialog title="Delete Audit Entry" message="Are you sure you want to delete this audit log entry?" onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} />}
      {bulkDelete && <ConfirmDialog title="Delete Selected" message={`Delete ${selected.size} audit entries?`} confirmLabel={`Delete ${selected.size}`} onConfirm={handleBulkDelete} onCancel={() => setBulkDelete(false)} />}
    </section>
  );
}
