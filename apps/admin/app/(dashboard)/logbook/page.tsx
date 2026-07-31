"use client";

import { useEffect, useState, useMemo } from "react";
import { useSort } from "@/lib/hooks/use-sort";
import { Pagination } from "@/lib/components/pagination";
import { ErrorState } from "@/lib/components/error-state";
import { BulkActionsBar } from "@/lib/components/bulk-actions";
import { ConfirmDialog } from "@/lib/components/confirm-dialog";
import { useToast } from "@/lib/components/toast";

export default function LogbookPage() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [bulkDelete, setBulkDelete] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/pilot-logbook");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setEntries(json.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load logbook entries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const { sorted, sort, toggle } = useSort(entries, "date", "desc");

  const filtered = useMemo(() => {
    let result = sorted;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((e) =>
        (e.user_id || "").toLowerCase().includes(q) ||
        (e.route || "").toLowerCase().includes(q) ||
        (e.aircraft_id || "").toLowerCase().includes(q) ||
        (e.aircraft_type || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [sorted, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [search]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/pilot-logbook?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
      toast("Logbook entry deleted");
    } catch {
      toast("Failed to delete logbook entry", "error");
    }
    setDeleteTarget(null);
  };

  const handleBulkDelete = async () => {
    let success = 0;
    for (const id of selected) {
      try {
        const res = await fetch(`/api/v1/pilot-logbook?id=${id}`, { method: "DELETE" });
        if (res.ok) success++;
      } catch {}
    }
    setEntries((prev) => prev.filter((e) => !selected.has(e.id)));
    toast(`${success} of ${selected.size} entries deleted`);
    setSelected(new Set());
    setBulkDelete(false);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; });
  };

  const toggleAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map((e) => e.id)));
  };

  const totalHours = entries.reduce((s, e) => s + (parseFloat(e.total_hours) || 0), 0);
  const totalLandings = entries.reduce((s, e) => s + (parseInt(e.landings) || 0), 0);

  const sortIcon = (key: string) => {
    if (sort.key !== key) return null;
    return <span className="ml-1 inline-block">{sort.dir === "asc" ? "▲" : "▼"}</span>;
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-runway-300 border-t-brand-500" />
    </div>
  );

  if (error) return (
    <section className="space-y-6">
      <div><h1 className="text-2xl font-semibold text-runway-900">Pilot Logbook</h1><p className="mt-1 text-sm text-runway-500">Flight hours and log entries across all pilots.</p></div>
      <ErrorState message={error} onRetry={fetchData} />
    </section>
  );

  return (
    <section className="space-y-6">
      <div><h1 className="text-2xl font-semibold text-runway-900">Pilot Logbook</h1><p className="mt-1 text-sm text-runway-500">Flight hours and log entries across all pilots.</p></div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Total Entries</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{entries.length}</p>
        </div>
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Total Hours</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{totalHours.toFixed(1)}</p>
        </div>
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Total Landings</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{totalLandings}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-runway-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-runway-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <input type="text" placeholder="Search by pilot, route, or aircraft..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-runway-300 bg-white px-3 py-2 text-sm text-runway-900 placeholder-runway-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:max-w-sm" />
        </div>

        <BulkActionsBar selectedCount={selected.size} onDeleteSelected={() => setBulkDelete(true)} onClear={() => setSelected(new Set())} />

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-runway-200">
            <thead className="bg-runway-50">
              <tr>
                <th className="w-10 px-4 py-3 text-left"><input type="checkbox" checked={paginated.length > 0 && selected.size === paginated.length} onChange={toggleAll} className="rounded border-runway-300 text-brand-600 focus:ring-brand-500" /></th>
                <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600 hover:text-runway-900" onClick={() => toggle("user_id")}>Pilot{sortIcon("user_id")}</th>
                <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600 hover:text-runway-900" onClick={() => toggle("date")}>Date{sortIcon("date")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Route</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Aircraft</th>
                <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600 hover:text-runway-900" onClick={() => toggle("total_hours")}>Hours{sortIcon("total_hours")}</th>
                <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600 hover:text-runway-900" onClick={() => toggle("landings")}>Landings{sortIcon("landings")}</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-runway-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-runway-100">
              {paginated.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-16 text-center">
                  <svg className="mx-auto h-10 w-10 text-runway-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  <p className="mt-3 text-sm font-medium text-runway-500">No logbook entries{search ? " matching search" : ""}</p>
                </td></tr>
              )}
              {paginated.map((e: any) => (
                <tr key={e.id} className="transition-colors hover:bg-runway-50">
                  <td className="px-4 py-3"><input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleSelect(e.id)} className="rounded border-runway-300 text-brand-600 focus:ring-brand-500" /></td>
                  <td className="px-4 py-3 text-sm font-medium text-runway-900">{e.user_id || "—"}</td>
                  <td className="px-4 py-3 text-sm text-runway-500">{e.date || "—"}</td>
                  <td className="px-4 py-3 text-sm text-runway-700">{e.route || `${e.departure || ""}→${e.arrival || ""}`}</td>
                  <td className="px-4 py-3 text-sm text-runway-700">{e.aircraft_id || e.aircraft_type || "—"}</td>
                  <td className="px-4 py-3 text-sm font-mono text-runway-900">{e.total_hours ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-runway-700">{e.landings ?? "—"}</td>
                  <td className="px-4 py-3 text-right"><button onClick={() => setDeleteTarget(e.id)} className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      </div>

      {deleteTarget && <ConfirmDialog title="Delete Logbook Entry" message="Are you sure you want to delete this logbook entry?" onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} />}
      {bulkDelete && <ConfirmDialog title="Delete Selected" message={`Delete ${selected.size} logbook entries?`} confirmLabel={`Delete ${selected.size}`} onConfirm={handleBulkDelete} onCancel={() => setBulkDelete(false)} />}
    </section>
  );
}
