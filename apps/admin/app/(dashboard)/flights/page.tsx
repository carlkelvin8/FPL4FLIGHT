"use client";

import { useEffect, useState, useMemo } from "react";
import { useSort } from "@/lib/hooks/use-sort";
import { Pagination } from "@/lib/components/pagination";
import { ErrorState } from "@/lib/components/error-state";
import { BulkActionsBar } from "@/lib/components/bulk-actions";
import { ConfirmDialog } from "@/lib/components/confirm-dialog";
import { useToast } from "@/lib/components/toast";

export default function FlightsPage() {
  const { toast } = useToast();
  const [flights, setFlights] = useState<any[]>([]);
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
      const res = await fetch("/api/v1/flights");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setFlights(json.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load flights");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const { sorted, sort, toggle } = useSort(flights, "date", "desc");

  const filtered = useMemo(() => {
    let result = sorted;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((f) =>
        (f.flight_number || "").toLowerCase().includes(q) ||
        (f.departure_code || "").toLowerCase().includes(q) ||
        (f.arrival_code || "").toLowerCase().includes(q) ||
        (f.aircraft || "").toLowerCase().includes(q) ||
        (f.pilot_in_command || "").toLowerCase().includes(q) ||
        (f.status || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [sorted, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [search]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/flights?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setFlights((prev) => prev.filter((f) => f.id !== id));
      setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
      toast("Flight deleted");
    } catch {
      toast("Failed to delete flight", "error");
    }
    setDeleteTarget(null);
  };

  const handleBulkDelete = async () => {
    let success = 0;
    for (const id of selected) {
      try {
        const res = await fetch(`/api/v1/flights?id=${id}`, { method: "DELETE" });
        if (res.ok) success++;
      } catch {}
    }
    setFlights((prev) => prev.filter((f) => !selected.has(f.id)));
    toast(`${success} of ${selected.size} flights deleted`);
    setSelected(new Set());
    setBulkDelete(false);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const toggleAll = () => {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map((f) => f.id)));
    }
  };

  const total = flights.length;
  const active = flights.filter((f) => f.status === "scheduled" || f.status === "departed").length;
  const completed = flights.filter((f) => f.status === "completed" || f.status === "arrived").length;
  const delayed = flights.filter((f) => f.status === "delayed").length;

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
      <div><h1 className="text-2xl font-semibold text-runway-900">Flights</h1><p className="mt-1 text-sm text-runway-500">All flight schedules and tracking data.</p></div>
      <ErrorState message={error} onRetry={fetchData} />
    </section>
  );

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-runway-900">Flights</h1>
          <p className="mt-1 text-sm text-runway-500">All flight schedules and tracking data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Total</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{total}</p>
        </div>
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Active</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{active}</p>
        </div>
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Completed</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{completed}</p>
        </div>
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Delayed</p>
          <p className={`mt-1 text-2xl font-semibold ${delayed > 0 ? "text-red-600" : "text-runway-900"}`}>{delayed}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-runway-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-runway-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            placeholder="Search flight number, route, aircraft, PIC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-runway-300 bg-white px-3 py-2 text-sm text-runway-900 placeholder-runway-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:max-w-sm"
          />
        </div>

        <BulkActionsBar selectedCount={selected.size} onDeleteSelected={() => setBulkDelete(true)} onClear={() => setSelected(new Set())} />

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-runway-200">
            <thead className="bg-runway-50">
              <tr>
                <th className="w-10 px-4 py-3 text-left">
                  <input type="checkbox" checked={paginated.length > 0 && selected.size === paginated.length} onChange={toggleAll} className="rounded border-runway-300 text-brand-600 focus:ring-brand-500" />
                </th>
                <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600 hover:text-runway-900" onClick={() => toggle("flight_number")}>
                  Flight{sortIcon("flight_number")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Route</th>
                <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600 hover:text-runway-900" onClick={() => toggle("date")}>
                  Date{sortIcon("date")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Aircraft</th>
                <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600 hover:text-runway-900" onClick={() => toggle("status")}>
                  Status{sortIcon("status")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">PIC</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-runway-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-runway-100">
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <svg className="mx-auto h-10 w-10 text-runway-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 15a4 4 0 004 4h9a5 5 0 10-4.5-7.5A4 4 0 003 15z" /></svg>
                    <p className="mt-3 text-sm font-medium text-runway-500">No flights{search ? " matching search" : " recorded"}</p>
                  </td>
                </tr>
              )}
              {paginated.map((f: any) => (
                <tr key={f.id} className="transition-colors hover:bg-runway-50">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(f.id)} onChange={() => toggleSelect(f.id)} className="rounded border-runway-300 text-brand-600 focus:ring-brand-500" />
                  </td>
                  <td className="px-4 py-3 text-sm font-mono font-medium text-runway-900">{f.flight_number || "—"}</td>
                  <td className="px-4 py-3 text-sm text-runway-700">{f.departure_code || "?"} → {f.arrival_code || "?"}</td>
                  <td className="px-4 py-3 text-sm text-runway-500">{f.date || "—"}</td>
                  <td className="px-4 py-3 text-sm text-runway-700">{f.aircraft || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      f.status === "completed" ? "bg-green-100 text-green-700" :
                      f.status === "scheduled" ? "bg-blue-100 text-blue-700" :
                      f.status === "departed" ? "bg-amber-100 text-amber-700" :
                      f.status === "arrived" ? "bg-green-100 text-green-700" :
                      f.status === "delayed" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>{f.status || "unknown"}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-runway-500">{f.pilot_in_command || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setDeleteTarget(f.id)} className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      </div>

      {deleteTarget && (
        <ConfirmDialog title="Delete Flight" message="Are you sure you want to delete this flight?" onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} />
      )}
      {bulkDelete && (
        <ConfirmDialog title="Delete Selected" message={`Delete ${selected.size} flights?`} confirmLabel={`Delete ${selected.size}`} onConfirm={handleBulkDelete} onCancel={() => setBulkDelete(false)} />
      )}
    </section>
  );
}
