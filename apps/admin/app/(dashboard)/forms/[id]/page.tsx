"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { FormTemplate } from "@pilotforms/shared";

export default function FormEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/v1/forms/${id}`)
      .then((r) => r.json())
      .then((res) => {
        const t = res.data ?? res;
        setTemplate(t);
        setName(t.name);
        setDescription(t.description ?? "");
      })
      .catch(() => setMessage({ type: "error", text: "Failed to load template" }))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/forms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name, description: description || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setTemplate(data.data);
      setMessage({ type: "success", text: "Template saved." });
      router.refresh();
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  async function handleAction(action: "publish" | "deprecate") {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/v1/forms/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `${action} failed`);
      setTemplate(data.data);
      setName(data.data.name);
      setDescription(data.data.description ?? "");
      setMessage({ type: "success", text: `Template ${action}d.` });
      router.refresh();
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : `${action} failed` });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-runway-300 border-t-brand-500" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg font-semibold text-runway-900">Template not found</p>
        <Link href="/forms" className="mt-2 text-sm text-brand-600 hover:underline">Back to templates</Link>
      </div>
    );
  }

  const statusText = template.deprecated ? "deprecated" : template.isActive ? "active" : "draft";
  const schemaData = template.schema as unknown as Record<string, unknown> | undefined;
  const sections = (schemaData?.sections as Array<{ id: string; title?: string; fields?: Array<{ id: string; label?: string; type?: string }> }> | undefined) ?? [];
  const fieldCount = sections.reduce((sum: number, s) => sum + (s.fields?.length ?? 0), 0);

  return (
    <section className="space-y-6">
      <div>
        <Link href="/forms" className="mb-3 inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          Back to templates
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-2xl font-semibold text-runway-900 bg-transparent border-0 border-b border-transparent focus:border-brand-400 focus:outline-none focus:ring-0 pb-1"
              placeholder="Template name"
            />
            <p className="mt-1 text-sm text-runway-500">
              {template.slug} &middot; v{template.version}
            </p>
          </div>
          <span className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${
            statusText === "active" ? "bg-green-100 text-green-700" :
            statusText === "deprecated" ? "bg-red-100 text-red-700" :
            "bg-yellow-100 text-yellow-700"
          }`}>{statusText}</span>
        </div>
      </div>

      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-runway-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-runway-900">Description</h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-runway-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              placeholder="Template description..."
            />
          </div>

          <div className="rounded-xl border border-runway-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-runway-900">Schema Fields</h3>
              <span className="text-xs text-runway-400">{fieldCount} fields in {sections.length} sections</span>
            </div>
            {sections.length === 0 ? (
              <p className="text-sm text-runway-400">No schema fields defined.</p>
            ) : (
              <div className="space-y-3">
                {sections.map((section) => (
                  <div key={section.id}>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-runway-500">{section.title || section.id}</p>
                    <div className="space-y-1">
                      {(section.fields ?? []).map((field) => (
                        <div key={field.id} className="flex items-center gap-2 rounded-lg bg-runway-50 px-3 py-2 text-sm">
                          <span className="font-mono text-runway-900">{field.label || field.id}</span>
                          {field.type && <span className="rounded bg-runway-200 px-1.5 py-0.5 text-[10px] font-medium text-runway-500">{field.type}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-runway-200 bg-white">
            <div className="border-b border-runway-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-runway-900">Template Info</h3>
            </div>
            <dl className="divide-y divide-runway-100 px-4 py-2 text-sm">
              <div className="flex justify-between py-2">
                <dt className="text-runway-500">Slug</dt>
                <dd className="font-mono font-medium text-runway-900">{template.slug}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-runway-500">Version</dt>
                <dd className="font-mono font-medium text-runway-900">v{template.version}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-runway-500">Fields</dt>
                <dd className="font-medium text-runway-900">{fieldCount}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-runway-500">Status</dt>
                <dd className="font-medium capitalize text-runway-900">{statusText}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-runway-500">Created</dt>
                <dd className="font-medium text-runway-900">
                  {template.createdAt ? new Date(template.createdAt).toLocaleDateString() : "—"}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-runway-500">Updated</dt>
                <dd className="font-medium text-runway-900">
                  {template.updatedAt ? new Date(template.updatedAt).toLocaleDateString() : "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            {!template.isActive && !template.deprecated && (
              <button
                onClick={() => handleAction("publish")}
                disabled={saving}
                className="w-full rounded-lg border border-green-300 px-4 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-50 disabled:opacity-50"
              >
                Publish
              </button>
            )}

            {template.isActive && !template.deprecated && (
              <button
                onClick={() => handleAction("deprecate")}
                disabled={saving}
                className="w-full rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                Deprecate
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
