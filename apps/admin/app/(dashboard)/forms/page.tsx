"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSort } from "@/lib/hooks/use-sort";
import { Pagination } from "@/lib/components/pagination";
import { ErrorState } from "@/lib/components/error-state";
import { BulkActionsBar } from "@/lib/components/bulk-actions";
import { ConfirmDialog } from "@/lib/components/confirm-dialog";
import { useToast } from "@/lib/components/toast";

const STATUS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
  deprecated: "bg-red-100 text-red-700",
};

function getStatus(t: { isActive: boolean; deprecated: boolean }): string {
  if (t.deprecated) return "deprecated";
  if (t.isActive) return "active";
  return "draft";
}

export default function FormsPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<any[]>([]);
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
      const res = await fetch("/api/v1/forms");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setTemplates(json.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const { sorted, sort, toggle } = useSort(templates, "name");

  const filtered = useMemo(() => {
    let result = sorted;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) =>
        (t.name || "").toLowerCase().includes(q) ||
        (t.slug || "").toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [sorted, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [search]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/forms?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
      toast("Template deleted");
    } catch {
      toast("Failed to delete template", "error");
    }
    setDeleteTarget(null);
  };

  const handleBulkDelete = async () => {
    let success = 0;
    for (const id of selected) {
      try {
        const res = await fetch(`/api/v1/forms?id=${id}`, { method: "DELETE" });
        if (res.ok) success++;
      } catch {}
    }
    setTemplates((prev) => prev.filter((t) => !selected.has(t.id)));
    toast(`${success} of ${selected.size} templates deleted`);
    setSelected(new Set());
    setBulkDelete(false);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; });
  };

  const toggleAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map((t) => t.id)));
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
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold text-runway-900">Form Templates</h1><p className="mt-1 text-sm text-runway-500">Create and manage aviation form templates for pilots.</p></div>
      </div>
      <ErrorState message={error} onRetry={fetchData} />
    </section>
  );

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-runway-900">Form Templates</h1>
          <p className="mt-1 text-sm text-runway-500">Create and manage aviation form templates for pilots.</p>
        </div>
        <Link href="/forms/new" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700">
          Create Template
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Total</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{templates.length}</p>
        </div>
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Active</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{templates.filter((t) => t.isActive).length}</p>
        </div>
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Draft</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{templates.filter((t) => !t.isActive && !t.deprecated).length}</p>
        </div>
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Deprecated</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{templates.filter((t) => t.deprecated).length}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-runway-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-runway-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <input type="text" placeholder="Search by name, slug, or description..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-runway-300 bg-white px-3 py-2 text-sm text-runway-900 placeholder-runway-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:max-w-sm" />
        </div>

        <BulkActionsBar selectedCount={selected.size} onDeleteSelected={() => setBulkDelete(true)} onClear={() => setSelected(new Set())} />

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-runway-200">
            <thead className="bg-runway-50">
              <tr>
                <th className="w-10 px-4 py-3 text-left"><input type="checkbox" checked={paginated.length > 0 && selected.size === paginated.length} onChange={toggleAll} className="rounded border-runway-300 text-brand-600 focus:ring-brand-500" /></th>
                <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600 hover:text-runway-900" onClick={() => toggle("name")}>Template{sortIcon("name")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Slug</th>
                <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600 hover:text-runway-900" onClick={() => toggle("version")}>Version{sortIcon("version")}</th>
                <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600 hover:text-runway-900" onClick={() => toggle("isActive")}>Status{sortIcon("isActive")}</th>
                <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600 hover:text-runway-900" onClick={() => toggle("updatedAt")}>Updated{sortIcon("updatedAt")}</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-runway-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-runway-100">
              {paginated.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-16 text-center">
                  <svg className="mx-auto h-10 w-10 text-runway-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <p className="mt-3 text-sm font-medium text-runway-500">No form templates{search ? " matching search" : " yet"}</p>
                </td></tr>
              )}
              {paginated.map((t: any) => {
                const st = getStatus(t);
                return (
                  <tr key={t.id} className="transition-colors hover:bg-runway-50">
                    <td className="px-4 py-3"><input type="checkbox" checked={selected.has(t.id)} onChange={() => toggleSelect(t.id)} className="rounded border-runway-300 text-brand-600 focus:ring-brand-500" /></td>
                    <td className="px-4 py-3">
                      <Link href={`/forms/${t.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-800">{t.name}</Link>
                      {t.description && <p className="text-xs text-runway-500">{t.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-runway-500">{t.slug}</td>
                    <td className="px-4 py-3 text-sm text-runway-700">v{t.version}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS[st]}`}>{st}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-runway-600">
                      {new Date(t.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <div className="flex justify-end gap-2">
                        <Link href={`/forms/${t.id}`} className="rounded-md px-2.5 py-1 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50">Edit</Link>
                        <button onClick={() => setDeleteTarget(t.id)} className="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      </div>

      {deleteTarget && <ConfirmDialog title="Delete Template" message="Are you sure you want to delete this form template?" onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} />}
      {bulkDelete && <ConfirmDialog title="Delete Selected" message={`Delete ${selected.size} templates?`} confirmLabel={`Delete ${selected.size}`} onConfirm={handleBulkDelete} onCancel={() => setBulkDelete(false)} />}
    </section>
  );
}
