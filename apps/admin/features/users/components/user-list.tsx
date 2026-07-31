"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ProfileRow } from "../repository";
import { deleteUser } from "../actions";
import { CreateUserDialog } from "./create-user-dialog";
import { EditUserDialog } from "./edit-user-dialog";
import { ConfirmDialog } from "@/lib/components/confirm-dialog";
import { useToast } from "@/lib/components/toast";
import { useSort } from "@/lib/hooks/use-sort";
import { Pagination } from "@/lib/components/pagination";
import { BulkActionsBar } from "@/lib/components/bulk-actions";

interface Props {
  users: ProfileRow[];
}

export function UserList({ users: initialUsers }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<ProfileRow | null>(null);
  const [deletingUser, setDeletingUser] = useState<ProfileRow | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDelete, setBulkDelete] = useState(false);

  const { sorted, sort, toggle } = useSort(users, "full_name");

  const filtered = useMemo(() => {
    let result = sorted;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((u) => u.full_name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q));
    }
    if (roleFilter) {
      result = result.filter((u) => u.role === roleFilter);
    }
    return result;
  }, [sorted, search, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Reset page on filter change
  const prevFilterKey = `${search}-${roleFilter}`;
  const [lastFilterKey, setLastFilterKey] = useState(prevFilterKey);
  if (prevFilterKey !== lastFilterKey) {
    setPage(1);
    setLastFilterKey(prevFilterKey);
  }

  async function handleDelete() {
    if (!deletingUser) return;
    setActionError(null);
    const result = await deleteUser(deletingUser.id);
    if (result.error) {
      setActionError(result.error);
      toast(result.error, "error");
    } else {
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      setSelected((prev) => { const s = new Set(prev); s.delete(deletingUser.id); return s; });
      toast("User deleted successfully");
      router.refresh();
    }
    setDeletingUser(null);
  }

  const handleBulkDelete = async () => {
    let success = 0;
    for (const id of selected) {
      const result = await deleteUser(id);
      if (!result.error) success++;
    }
    setUsers((prev) => prev.filter((u) => !selected.has(u.id)));
    toast(`${success} of ${selected.size} users deleted`);
    setSelected(new Set());
    setBulkDelete(false);
    router.refresh();
  };

  const handleSave = useCallback((updated: ProfileRow) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setEditingUser(null);
    toast("User updated successfully");
    router.refresh();
  }, [router, toast]);

  const handleCreated = useCallback((user: ProfileRow) => {
    setUsers((prev) => [user, ...prev]);
    toast("User created successfully");
    router.refresh();
  }, [router, toast]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; });
  };

  const toggleAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map((u) => u.id)));
  };

  const sortIcon = (key: string) => {
    if (sort.key !== key) return null;
    return <span className="ml-1 inline-block">{sort.dir === "asc" ? "▲" : "▼"}</span>;
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-runway-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input type="text" placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-runway-300 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm transition-colors focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400" />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-runway-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400">
            <option value="">All roles</option>
            <option value="pilot">Pilots</option>
            <option value="admin">Admins</option>
          </select>
        </div>
        <CreateUserDialog onCreated={handleCreated} />
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
                <th className="cursor-pointer px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-runway-500 hover:text-runway-900" onClick={() => toggle("full_name")}>
                  User{sortIcon("full_name")}
                </th>
                <th className="cursor-pointer px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-runway-500 hover:text-runway-900" onClick={() => toggle("role")}>
                  Role{sortIcon("role")}
                </th>
                <th className="cursor-pointer px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-runway-500 hover:text-runway-900" onClick={() => toggle("created_at")}>
                  Joined{sortIcon("created_at")}
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-runway-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-runway-100">
              {paginated.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-runway-400">
                  {search || roleFilter ? "No users match your search." : "No users yet."}
                </td></tr>
              )}
              {paginated.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-runway-50">
                  <td className="px-4 py-3.5">
                    <input type="checkbox" checked={selected.has(user.id)} onChange={() => toggleSelect(user.id)} className="rounded border-runway-300 text-brand-600 focus:ring-brand-500" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white shadow-sm">
                        {user.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <Link href={`/users/${user.id}`} className="text-sm font-semibold text-runway-900 hover:text-brand-600 transition-colors">
                          {user.full_name}
                        </Link>
                        <p className="text-xs text-runway-400 font-mono">{user.id.slice(0, 8)}…</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${user.role === "admin" ? "bg-purple-100 text-purple-700 ring-1 ring-purple-200" : "bg-blue-100 text-blue-700 ring-1 ring-blue-200"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-runway-500">
                    {new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingUser(user)} className="rounded-lg border border-runway-300 px-3 py-1.5 text-xs font-medium text-runway-700 transition-colors hover:bg-runway-50 hover:border-runway-400">Edit</button>
                      <button onClick={() => setDeletingUser(user)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      </div>

      {editingUser && (
        <EditUserDialog user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSave} />
      )}

      {deletingUser && (
        <ConfirmDialog title="Delete User" message={`Are you sure you want to delete ${deletingUser.full_name}?`} onConfirm={handleDelete} onCancel={() => setDeletingUser(null)} />
      )}

      {bulkDelete && (
        <ConfirmDialog title="Delete Selected" message={`Delete ${selected.size} users?`} confirmLabel={`Delete ${selected.size}`} onConfirm={handleBulkDelete} onCancel={() => setBulkDelete(false)} />
      )}
    </div>
  );
}
