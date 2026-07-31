"use client";

import { useEffect, useState, useMemo } from "react";
import { useSort } from "@/lib/hooks/use-sort";
import { Pagination } from "@/lib/components/pagination";
import { ErrorState } from "@/lib/components/error-state";
import { BulkActionsBar } from "@/lib/components/bulk-actions";
import { ConfirmDialog } from "@/lib/components/confirm-dialog";
import { useToast } from "@/lib/components/toast";

export default function AircraftPage() {
  const { toast } = useToast();
  const [aircraft, setAircraft] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [bulkDelete, setBulkDelete] = useState(false);

  const fetchAircraft = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/aircraft");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setAircraft(json.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load aircraft");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAircraft(); }, []);

  const { sorted, sort, toggle } = useSort(aircraft, "aircraft_id");

  const filtered = useMemo(() => {
    let result = sorted;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((a) =>
        (a.aircraft_id || "").toLowerCase().includes(q) ||
        (a.type_of_aircraft || "").toLowerCase().includes(q) ||
        (a.equipment || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [sorted, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [search]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/aircraft?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setAircraft((prev) => prev.filter((a) => a.id !== id));
      setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
      toast("Aircraft deleted");
    } catch {
      toast("Failed to delete aircraft", "error");
    }
    setDeleteTarget(null);
  };

  const handleBulkDelete = async () => {
    let success = 0;
    for (const id of selected) {
      try {
        const res = await fetch(`/api/v1/aircraft?id=${id}`, { method: "DELETE" });
        if (res.ok) success++;
      } catch {}
    }
    setAircraft((prev) => prev.filter((a) => !selected.has(a.id)));
    toast(`${success} of ${selected.size} aircraft deleted`);
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
      setSelected(new Set(paginated.map((a) => a.id)));
    }
  };

  const distinctTypes = new Set(filtered.map((a) => a.type_of_aircraft).filter(Boolean)).size;

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
      <div><h1 className="text-2xl font-semibold text-runway-900">Aircraft</h1><p className="mt-1 text-sm text-runway-500">ICAO aircraft equipment and surveillance data.</p></div>
      <ErrorState message={error} onRetry={fetchAircraft} />
    </section>
  );

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-runway-900">Aircraft</h1>
          <p className="mt-1 text-sm text-runway-500">ICAO aircraft equipment and surveillance data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Total</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{filtered.length}</p>
        </div>
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Types</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{distinctTypes}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-runway-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-runway-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            placeholder="Search aircraft ID, type, equipment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-runway-300 bg-white px-3 py-2 text-sm text-runway-900 placeholder-runway-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:max-w-sm"
          />
          {selected.size > 0 && (
            <span className="text-xs text-runway-500 sm:hidden">{selected.size} selected</span>
          )}
        </div>

        <BulkActionsBar
          selectedCount={selected.size}
          onDeleteSelected={() => setBulkDelete(true)}
          onClear={() => setSelected(new Set())}
        />

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-runway-200">
            <thead className="bg-runway-50">
              <tr>
                <th className="w-10 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selected.size === paginated.length}
                    onChange={toggleAll}
                    className="rounded border-runway-300 text-brand-600 focus:ring-brand-500"
                  />
                </th>
                <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600 hover:text-runway-900" onClick={() => toggle("aircraft_id")}>
                  Aircraft ID{sortIcon("aircraft_id")}
                </th>
                <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600 hover:text-runway-900" onClick={() => toggle("type_of_aircraft")}>
                  Type{sortIcon("type_of_aircraft")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Wake</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Equipment</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Surveillance</th>
                <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600 hover:text-runway-900" onClick={() => toggle("updated_at")}>
                  Updated{sortIcon("updated_at")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-runway-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-runway-100">
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <svg className="mx-auto h-10 w-10 text-runway-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 3l14 9-14 9V3z" /></svg>
                    <p className="mt-3 text-sm font-medium text-runway-500">No aircraft{search ? " matching search" : " registered"}</p>
                  </td>
                </tr>
              )}
              {paginated.map((a: any) => (
                <tr key={a.id} className="transition-colors hover:bg-runway-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(a.id)}
                      onChange={() => toggleSelect(a.id)}
                      className="rounded border-runway-300 text-brand-600 focus:ring-brand-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-mono font-medium text-runway-900">{a.aircraft_id}</td>
                  <td className="px-4 py-3 text-sm text-runway-700">{a.type_of_aircraft}</td>
                  <td className="px-4 py-3 text-sm text-runway-700">{a.wake_turbulence_category || "—"}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-sm font-mono text-runway-500" title={a.equipment}>{a.equipment || "—"}</td>
                  <td className="px-4 py-3 text-sm text-runway-500">{a.surveillance || "—"}</td>
                  <td className="px-4 py-3 text-sm text-runway-500">{new Date(a.updated_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setDeleteTarget(a.id)} className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Aircraft"
          message="Are you sure you want to delete this aircraft record?"
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {bulkDelete && (
        <ConfirmDialog
          title="Delete Selected Aircraft"
          message={`Are you sure you want to delete ${selected.size} aircraft records?`}
          confirmLabel={`Delete ${selected.size}`}
          onConfirm={handleBulkDelete}
          onCancel={() => setBulkDelete(false)}
        />
      )}
    </section>
  );
}
