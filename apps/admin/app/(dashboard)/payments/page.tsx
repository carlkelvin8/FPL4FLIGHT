"use client";

import { useEffect, useState, useMemo } from "react";
import { useSort } from "@/lib/hooks/use-sort";
import { Pagination } from "@/lib/components/pagination";
import { ErrorState } from "@/lib/components/error-state";
import { BulkActionsBar } from "@/lib/components/bulk-actions";
import { ConfirmDialog } from "@/lib/components/confirm-dialog";
import { useToast } from "@/lib/components/toast";

export default function PaymentsPage() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<any[]>([]);
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
      const res = await fetch("/api/v1/payments");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setPayments(json.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const { sorted, sort, toggle } = useSort(payments, "created_at", "desc");

  const filtered = useMemo(() => {
    let result = sorted;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        (p.profiles?.full_name || p.user_id || "").toLowerCase().includes(q) ||
        (p.status || "").toLowerCase().includes(q) ||
        (p.amount || "").toString().includes(q)
      );
    }
    return result;
  }, [sorted, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [search]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/payments?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setPayments((prev) => prev.filter((p) => p.id !== id));
      setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
      toast("Payment deleted");
    } catch {
      toast("Failed to delete payment", "error");
    }
    setDeleteTarget(null);
  };

  const handleBulkDelete = async () => {
    let success = 0;
    for (const id of selected) {
      try {
        const res = await fetch(`/api/v1/payments?id=${id}`, { method: "DELETE" });
        if (res.ok) success++;
      } catch {}
    }
    setPayments((prev) => prev.filter((p) => !selected.has(p.id)));
    toast(`${success} of ${selected.size} payments deleted`);
    setSelected(new Set());
    setBulkDelete(false);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; });
  };

  const toggleAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map((p) => p.id)));
  };

  const succeeded = payments.filter((p) => p.status === "succeeded").length;
  const totalRevenue = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

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
      <div><h1 className="text-2xl font-semibold text-runway-900">Payments</h1><p className="mt-1 text-sm text-runway-500">Subscription payment transactions.</p></div>
      <ErrorState message={error} onRetry={fetchData} />
    </section>
  );

  return (
    <section className="space-y-6">
      <div><h1 className="text-2xl font-semibold text-runway-900">Payments</h1><p className="mt-1 text-sm text-runway-500">Subscription payment transactions.</p></div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Total Transactions</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{payments.length}</p>
        </div>
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Succeeded</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{succeeded}</p>
        </div>
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Total Revenue</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-runway-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-runway-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <input type="text" placeholder="Search by user, status, or amount..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-runway-300 bg-white px-3 py-2 text-sm text-runway-900 placeholder-runway-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:max-w-sm" />
        </div>

        <BulkActionsBar selectedCount={selected.size} onDeleteSelected={() => setBulkDelete(true)} onClear={() => setSelected(new Set())} />

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-runway-200">
            <thead className="bg-runway-50">
              <tr>
                <th className="w-10 px-4 py-3 text-left"><input type="checkbox" checked={paginated.length > 0 && selected.size === paginated.length} onChange={toggleAll} className="rounded border-runway-300 text-brand-600 focus:ring-brand-500" /></th>
                <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600 hover:text-runway-900" onClick={() => toggle("user_id")}>User{sortIcon("user_id")}</th>
                <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600 hover:text-runway-900" onClick={() => toggle("amount")}>Amount{sortIcon("amount")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600">Currency</th>
                <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600 hover:text-runway-900" onClick={() => toggle("status")}>Status{sortIcon("status")}</th>
                <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600 hover:text-runway-900" onClick={() => toggle("paid_at")}>Paid At{sortIcon("paid_at")}</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-runway-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-runway-100">
              {paginated.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-16 text-center">
                  <svg className="mx-auto h-10 w-10 text-runway-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  <p className="mt-3 text-sm font-medium text-runway-500">No payments{search ? " matching search" : " yet"}</p>
                </td></tr>
              )}
              {paginated.map((p: any) => (
                <tr key={p.id} className="transition-colors hover:bg-runway-50">
                  <td className="px-4 py-3"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded border-runway-300 text-brand-600 focus:ring-brand-500" /></td>
                  <td className="px-4 py-3 text-sm font-medium text-runway-900">{p.profiles?.full_name || p.user_id}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-runway-900">{p.amount}</td>
                  <td className="px-4 py-3 text-sm text-runway-700">{p.currency}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${p.status === "succeeded" ? "bg-green-100 text-green-700" : p.status === "pending" ? "bg-yellow-100 text-yellow-700" : p.status === "refunded" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-runway-500">{p.paid_at ? new Date(p.paid_at).toLocaleString() : "—"}</td>
                  <td className="px-4 py-3 text-right"><button onClick={() => setDeleteTarget(p.id)} className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      </div>

      {deleteTarget && <ConfirmDialog title="Delete Payment" message="Are you sure you want to delete this payment?" onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} />}
      {bulkDelete && <ConfirmDialog title="Delete Selected" message={`Delete ${selected.size} payments?`} confirmLabel={`Delete ${selected.size}`} onConfirm={handleBulkDelete} onCancel={() => setBulkDelete(false)} />}
    </section>
  );
}
