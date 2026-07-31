"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProfileRow } from "../repository";
import { updateUser } from "../actions";

interface Props {
  user: ProfileRow;
  onClose: () => void;
  onSave: (updated: ProfileRow) => void;
}

export function EditUserDialog({ user, onClose, onSave }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(user.full_name);
  const [role, setRole] = useState(user.role);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("id", user.id);
    const result = await updateUser({ error: null, success: false }, formData);

    if (result.error) {
      setError(result.error);
      setSaving(false);
    } else {
      onSave({ ...user, full_name: fullName, role });
      router.refresh();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-runway-900">Edit User</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-runway-700">Full Name</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-runway-300 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-runway-700">Role</label>
            <select
              id="role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value as "pilot" | "admin")}
              className="mt-1 block w-full rounded-lg border border-runway-300 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            >
              <option value="pilot">Pilot</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-runway-700 transition-colors hover:bg-runway-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
