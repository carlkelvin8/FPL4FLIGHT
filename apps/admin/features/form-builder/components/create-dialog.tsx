"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTemplate } from "../actions";

const DEFAULT_SCHEMA = JSON.stringify(
  {
    sections: [
      {
        id: "section-1",
        title: "Section 1",
        fields: [
          { id: "field-1", label: "Field 1", type: "text", required: false },
        ],
      },
    ],
    metadata: {
      formType: "",
      regulatoryBasis: null,
      estimatedMinutes: 0,
    },
  },
  null,
  2,
);

export function CreateTemplateDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createTemplate({ error: null, success: false }, formData);

    if (result.error) {
      setError(result.error);
      setSaving(false);
    } else {
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
        Create Template
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-runway-900">Create Form Template</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-runway-700">
                  Slug
                </label>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  pattern="[a-z0-9-]+"
                  placeholder="pre-flight-checklist"
                  className="mt-1 block w-full rounded-lg border border-runway-300 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                />
                <p className="mt-1 text-xs text-runway-500">Lowercase alphanumeric with hyphens</p>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-runway-700">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Pre-Flight Checklist"
                  className="mt-1 block w-full rounded-lg border border-runway-300 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-runway-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={2}
                  className="mt-1 block w-full rounded-lg border border-runway-300 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                />
              </div>

              <div>
                <label htmlFor="schema" className="block text-sm font-medium text-runway-700">
                  Schema JSON
                </label>
                <textarea
                  id="schema"
                  name="schema"
                  rows={10}
                  defaultValue={DEFAULT_SCHEMA}
                  className="mt-1 block w-full rounded-lg border border-runway-300 px-3 py-2 font-mono text-xs shadow-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                />
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
