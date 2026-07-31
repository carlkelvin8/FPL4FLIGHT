"use client";

import { useEffect, useState, useMemo } from "react";
import { useSort } from "@/lib/hooks/use-sort";
import { Pagination } from "@/lib/components/pagination";
import { ErrorState } from "@/lib/components/error-state";
import { BulkActionsBar } from "@/lib/components/bulk-actions";
import { ConfirmDialog } from "@/lib/components/confirm-dialog";
import { useToast } from "@/lib/components/toast";

export default function OrganizationsPage() {
  const { toast } = useToast();
  const [orgs, setOrgs] = useState<any[]>([]);
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
      const res = await fetch("/api/v1/organizations");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setOrgs(json.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const { sorted, sort, toggle } = useSort(orgs, "name");

  const filtered = useMemo(() => {
    let result = sorted;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((o) =>
        (o.name || "").toLowerCase().includes(q) ||
        (o.slug || "").toLowerCase().includes(q) ||
        (o.plan || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [sorted, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [search]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/organizations?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setOrgs((prev) => prev.filter((o) => o.id !== id));
      setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
      toast("Organization deleted");
    } catch {
      toast("Failed to delete organization", "error");
    }
    setDeleteTarget(null);
  };

  const handleBulkDelete = async () => {
    let success = 0;
    for (const id of selected) {
      try {
        const res = await fetch(`/api/v1/organizations?id=${id}`, { method: "DELETE" });
        if (res.ok) success++;
      } catch {}
    }
    setOrgs((prev) => prev.filter((o) => !selected.has(o.id)));
    toast(`${success} of ${selected.size} organizations deleted`);
    setSelected(new Set());
    setBulkDelete(false);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; });
  };

  const toggleAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map((o) => o.id)));
  };

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
      <div><h1 className="text-2xl font-semibold text-runway-900">Organizations</h1><p className="mt-1 text-sm text-runway-500">Multi-tenant organization management.</p></div>
      <ErrorState message={error} onRetry={fetchData} />
    </section>
  );

  return (
    <section className="space-y-6">
      <div><h1 className="text-2xl font-semibold text-runway-900">Organizations</h1><p className="mt-1 text-sm text-runway-500">Multi-tenant organization management.</p></div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Total</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{orgs.length}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-runway-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-runway-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <input type="text" placeholder="Search by name, slug, or plan..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-runway-300 bg-white px-3 py-2 text-sm text-runway-900 placeholder-runway-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:max-w-sm" />
        </div>

        <BulkActionsBar selectedCount={selected.size} onDeleteSelected={() => setBulkDelete(true)} onClear={() => setSelected(new Set())} />

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-runway-200">
            <thead className="bg-runway-50">
              <tr>
                <th className="w-10 px-4 py-3 text-left"><input type="checkbox" checked={paginated.length > 0 && selected.size === paginated.length} onChange={toggleAll} className="rounded border-runway-300 text-brand-600 focus:ring-brand-500" /></th>
                <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600 hover:text-runway-900" onClick={() => toggle("name")}>Name{sortIcon("name")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Slug</th>
                <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600 hover:text-runway-900" onClick={() => toggle("plan")}>Plan{sortIcon("plan")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Max Members</th>
                <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600 hover:text-runway-900" onClick={() => toggle("created_at")}>Created{sortIcon("created_at")}</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-runway-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-runway-100">
              {paginated.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-16 text-center">
                  <svg className="mx-auto h-10 w-10 text-runway-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  <p className="mt-3 text-sm font-medium text-runway-500">No organizations{search ? " matching search" : ""}</p>
                </td></tr>
              )}
              {paginated.map((o: any) => (
                <tr key={o.id} className="transition-colors hover:bg-runway-50">
                  <td className="px-4 py-3"><input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleSelect(o.id)} className="rounded border-runway-300 text-brand-600 focus:ring-brand-500" /></td>
                  <td className="px-4 py-3 text-sm font-medium text-runway-900">{o.name}</td>
                  <td className="px-4 py-3 text-sm font-mono text-runway-500">{o.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${o.plan === "enterprise" ? "bg-purple-100 text-purple-700" : o.plan === "team" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>{o.plan || "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-runway-700">{o.max_members ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-runway-500">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right"><button onClick={() => setDeleteTarget(o.id)} className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      </div>

      {deleteTarget && <ConfirmDialog title="Delete Organization" message="Are you sure you want to delete this organization?" onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} />}
      {bulkDelete && <ConfirmDialog title="Delete Selected" message={`Delete ${selected.size} organizations?`} confirmLabel={`Delete ${selected.size}`} onConfirm={handleBulkDelete} onCancel={() => setBulkDelete(false)} />}
    </section>
  );
}
