"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewTemplatePage() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/v1/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, description: description || null, schema: { type: "object", properties: {}, sections: [] } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      router.push(`/forms/${data.data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/forms" className="mb-3 inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          Back to templates
        </Link>
        <h1 className="text-2xl font-semibold text-runway-900">Create Template</h1>
        <p className="mt-1 text-sm text-runway-500">Define a new aviation form template.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-runway-200 bg-white p-6">
        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-runway-700">Slug</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} required
            className="mt-1 w-full rounded-lg border border-runway-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400" placeholder="preflight-checklist" />
          <p className="mt-1 text-xs text-runway-400">URL-friendly identifier (lowercase, hyphens).</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-runway-700">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="mt-1 w-full rounded-lg border border-runway-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400" placeholder="Pre-Flight Checklist" />
        </div>

        <div>
          <label className="block text-sm font-medium text-runway-700">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="mt-1 w-full rounded-lg border border-runway-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400" placeholder="Standard pre-flight inspection checklist" />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50">
            {saving ? "Creating..." : "Create Template"}
          </button>
          <Link href="/forms" className="text-sm text-runway-500 hover:text-runway-700">Cancel</Link>
        </div>
      </form>
    </section>
  );
}
