"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProfileRow } from "../repository";
import { createUser } from "../actions";

interface Props {
  onCreated: (user: ProfileRow) => void;
}

export function CreateUserDialog({ onCreated }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createUser({ error: null, success: false }, formData);

    if (result.error) {
      setError(result.error);
      setSaving(false);
    } else {
      onCreated({
        id: crypto.randomUUID(),
        full_name: formData.get("full_name") as string,
        role: formData.get("role") as "pilot" | "admin",
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
      >
        Create User
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-runway-900">Create User</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-runway-700">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="pilot@example.com"
                  className="mt-1 block w-full rounded-lg border border-runway-300 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-runway-700">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="mt-1 block w-full rounded-lg border border-runway-300 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                />
              </div>

              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-runway-700">Full Name</label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  placeholder="John Doe"
                  className="mt-1 block w-full rounded-lg border border-runway-300 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-runway-700">Role</label>
                <select
                  id="role"
                  name="role"
                  required
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
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-runway-700 transition-colors hover:bg-runway-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
