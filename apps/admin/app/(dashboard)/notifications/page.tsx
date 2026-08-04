"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSort } from "@/lib/hooks/use-sort";
import { Pagination } from "@/lib/components/pagination";
import { ErrorState } from "@/lib/components/error-state";
import { BulkActionsBar } from "@/lib/components/bulk-actions";
import { ConfirmDialog } from "@/lib/components/confirm-dialog";
import { useToast } from "@/lib/components/toast";

export default function NotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
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
      const res = await fetch("/api/v1/notifications");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setNotifications(json.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const { sorted, sort, toggle } = useSort(notifications, "created_at", "desc");

  const filtered = useMemo(() => {
    let result = sorted;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((n) =>
        (n.profiles?.full_name || n.user_id || "").toLowerCase().includes(q) ||
        (n.title || "").toLowerCase().includes(q) ||
        (n.type || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [sorted, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [search]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/notifications?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
      toast("Notification deleted");
    } catch {
      toast("Failed to delete notification", "error");
    }
    setDeleteTarget(null);
  };

  const handleBulkDelete = async () => {
    let success = 0;
    for (const id of selected) {
      try {
        const res = await fetch(`/api/v1/notifications?id=${id}`, { method: "DELETE" });
        if (res.ok) success++;
      } catch {}
    }
    setNotifications((prev) => prev.filter((n) => !selected.has(n.id)));
    toast(`${success} of ${selected.size} notifications deleted`);
    setSelected(new Set());
    setBulkDelete(false);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; });
  };

  const toggleAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map((n) => n.id)));
  };

  const readCount = notifications.filter((n) => n.read).length;
  const unreadCount = notifications.filter((n) => !n.read).length;

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
      <div><h1 className="text-2xl font-semibold text-runway-900">Notifications</h1><p className="mt-1 text-sm text-runway-500">Manage system notifications sent to users.</p></div>
      <ErrorState message={error} onRetry={fetchData} />
    </section>
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-semibold text-runway-900">Notifications</h1><p className="mt-1 text-sm text-runway-500">Manage system notifications sent to users.</p></div>
        <Link href="/notifications/broadcast" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700">New Broadcast</Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Total</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{notifications.length}</p>
        </div>
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Read</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{readCount}</p>
        </div>
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Unread</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{unreadCount}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-runway-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-runway-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <input type="text" placeholder="Search by user, title, or type..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-runway-300 bg-white px-3 py-2 text-sm text-runway-900 placeholder-runway-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:max-w-sm" />
        </div>

        <BulkActionsBar selectedCount={selected.size} onDeleteSelected={() => setBulkDelete(true)} onClear={() => setSelected(new Set())} />

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-runway-200">
            <thead className="bg-runway-50">
              <tr>
                <th className="w-10 px-4 py-3 text-left"><input type="checkbox" checked={paginated.length > 0 && selected.size === paginated.length} onChange={toggleAll} className="rounded border-runway-300 text-brand-600 focus:ring-brand-500" /></th>
                <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600 hover:text-runway-900" onClick={() => toggle("user_id")}>User{sortIcon("user_id")}</th>
                <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600 hover:text-runway-900" onClick={() => toggle("type")}>Type{sortIcon("type")}</th>
                <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600 hover:text-runway-900" onClick={() => toggle("title")}>Title{sortIcon("title")}</th>
                <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600 hover:text-runway-900" onClick={() => toggle("read")}>Read{sortIcon("read")}</th>
                <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600 hover:text-runway-900" onClick={() => toggle("delivered")}>Delivered{sortIcon("delivered")}</th>
                <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-runway-600 hover:text-runway-900" onClick={() => toggle("created_at")}>Created{sortIcon("created_at")}</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-runway-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-runway-100">
              {paginated.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-16 text-center">
                  <svg className="mx-auto h-10 w-10 text-runway-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  <p className="mt-3 text-sm font-medium text-runway-500">No notifications{search ? " matching search" : ""}</p>
                </td></tr>
              )}
              {paginated.map((n: any) => (
                <tr key={n.id} className="transition-colors hover:bg-runway-50">
                  <td className="px-4 py-3"><input type="checkbox" checked={selected.has(n.id)} onChange={() => toggleSelect(n.id)} className="rounded border-runway-300 text-brand-600 focus:ring-brand-500" /></td>
                  <td className="px-4 py-3 text-sm font-medium text-runway-900">{n.profiles?.full_name || n.user_id}</td>
                  <td className="px-4 py-3 text-sm text-runway-700">{n.type || "—"}</td>
                  <td className="px-4 py-3 text-sm text-runway-900">{n.title}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${n.read ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{n.read ? "Yes" : "No"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${n.delivered ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{n.delivered ? "Yes" : "No"}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-runway-500">{new Date(n.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right"><button onClick={() => setDeleteTarget(n.id)} className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      </div>

      {deleteTarget && <ConfirmDialog title="Delete Notification" message="Are you sure you want to delete this notification?" onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} />}
      {bulkDelete && <ConfirmDialog title="Delete Selected" message={`Delete ${selected.size} notifications?`} confirmLabel={`Delete ${selected.size}`} onConfirm={handleBulkDelete} onCancel={() => setBulkDelete(false)} />}
    </section>
  );
}
