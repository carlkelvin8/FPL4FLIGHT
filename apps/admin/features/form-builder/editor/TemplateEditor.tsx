"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormSchema } from "@pilotforms/shared";
import { useToast } from "@/lib/components/toast";
import {
  type SerializedTemplate,
  createDefaultSchema,
  updateSchemaMetadata,
  addSection,
  validateSchema,
  summarizeSchema,
  allFields,
} from "../schema-builder";
import { SectionCard } from "./SectionCard";
import { SchemaPreview } from "./SchemaPreview";

const inputClass =
  "w-full rounded-lg border border-runway-300 bg-white px-3 py-2 text-sm text-runway-900 placeholder-runway-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";
const labelClass = "mb-1.5 block text-sm font-medium text-runway-700";

interface TemplateEditorProps {
  mode: "create" | "edit";
  initial?: SerializedTemplate;
}

export function TemplateEditor({ mode, initial }: TemplateEditorProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [schema, setSchema] = useState<FormSchema>(initial?.schema ?? createDefaultSchema());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validation = useMemo(() => validateSchema(schema), [schema]);
  const stats = useMemo(() => summarizeSchema(schema), [schema]);
  const conditionalOptions = useMemo(() => allFields(schema), [schema]);

  const slugInvalid = mode === "create" && !/^[a-z0-9-]+$/.test(slug.trim());
  const nameInvalid = !name.trim();
  const canSave = validation.valid && !nameInvalid && !slugInvalid;

  function handleMetadata(patch: Parameters<typeof updateSchemaMetadata>[1]) {
    setSchema((s) => updateSchemaMetadata(s, patch));
  }

  async function handleSave() {
    setError(null);

    if (mode === "create" && slugInvalid) {
      setError("Slug must be lowercase alphanumeric with hyphens.");
      return;
    }
    if (nameInvalid) {
      setError("Template name is required.");
      return;
    }
    if (!validation.valid) {
      setError(validation.errors[0] ?? "Please fix the schema before saving.");
      return;
    }

    setSaving(true);
    try {
      if (mode === "create") {
        const res = await fetch("/api/v1/forms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: slug.trim(),
            name: name.trim(),
            description: description.trim() || null,
            schema,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to create template");
        toast("Template created");
        router.replace(`/forms/${json.data.id}`);
      } else {
        const res = await fetch("/api/v1/forms", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: initial!.id,
            name: name.trim(),
            description: description.trim() || null,
            schema,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to save template");
        toast("Template saved");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/forms" className="mb-3 inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            Back to templates
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-runway-900">
              {mode === "create" ? "Create Template" : name.trim() || "Untitled Template"}
            </h1>
            {mode === "edit" && (
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${initial?.deprecated ? "bg-red-100 text-red-700" : initial?.isActive ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {initial?.deprecated ? "deprecated" : initial?.isActive ? "active" : "draft"}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-runway-500">Design the form structure pilots will fill in the app.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="self-start rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          {saving ? "Saving…" : mode === "create" ? "Create Template" : "Save Changes"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-runway-200 bg-white p-6">
            <p className="mb-4 text-sm font-semibold text-runway-900">Template Details</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="template-slug">Slug</label>
                <input
                  id="template-slug"
                  type="text"
                  value={slug}
                  disabled={mode === "edit"}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  placeholder="preflight-checklist"
                  className={`${inputClass} ${mode === "edit" ? "cursor-not-allowed bg-runway-50 text-runway-500" : ""}`}
                />
                <p className="mt-1 text-xs text-runway-400">
                  {mode === "edit" ? "Slug cannot be changed after creation." : "URL-friendly identifier (lowercase, hyphens)."}
                </p>
              </div>
              <div>
                <label className={labelClass} htmlFor="template-name">Name</label>
                <input id="template-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Pre-Flight Checklist" className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="template-description">Description</label>
                <textarea id="template-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Standard pre-flight inspection checklist" className={`${inputClass} resize-none`} />
              </div>
              <div>
                <label className={labelClass} htmlFor="template-form-type">Form type</label>
                <input id="template-form-type" type="text" value={schema.metadata.formType} onChange={(e) => handleMetadata({ formType: e.target.value })} placeholder="pre-flight" className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="template-regulatory">Regulatory basis</label>
                <input id="template-regulatory" type="text" value={schema.metadata.regulatoryBasis ?? ""} onChange={(e) => handleMetadata({ regulatoryBasis: e.target.value || null })} placeholder="e.g. FAR 91.409" className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="template-minutes">Estimated minutes</label>
                <input id="template-minutes" type="number" min={0} value={schema.metadata.estimatedMinutes} onChange={(e) => handleMetadata({ estimatedMinutes: Math.max(0, Number(e.target.value) || 0) })} className={inputClass} />
              </div>
            </div>
          </div>

          {schema.sections.map((section, i) => (
            <SectionCard
              key={section.id}
              schema={schema}
              section={section}
              sectionIndex={i}
              totalSections={schema.sections.length}
              conditionalOptions={conditionalOptions}
              onChange={setSchema}
            />
          ))}

          <button
            type="button"
            onClick={() => setSchema((s) => addSection(s))}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-runway-300 px-4 py-3 text-sm font-medium text-runway-500 transition-colors hover:border-brand-400 hover:text-brand-700"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
            Add Section
          </button>
        </div>

        <aside className="space-y-6">
          <div className={`rounded-xl border p-5 ${validation.valid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
            <div className="flex items-center gap-2">
              <svg className={`h-5 w-5 ${validation.valid ? "text-green-600" : "text-red-500"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {validation.valid
                  ? <path d="M5 13l4 4L19 7" />
                  : <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />}
              </svg>
              <p className={`text-sm font-semibold ${validation.valid ? "text-green-800" : "text-red-700"}`}>
                {validation.valid ? "Schema is valid" : `${validation.errors.length} issue${validation.errors.length === 1 ? "" : "s"} to fix`}
              </p>
            </div>
            {validation.valid ? (
              <div className="mt-3 flex gap-4 text-sm text-green-700">
                <span>{stats.sections} section{stats.sections === 1 ? "" : "s"}</span>
                <span>{stats.fields} field{stats.fields === 1 ? "" : "s"}</span>
              </div>
            ) : (
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-red-700">
                {validation.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
          </div>

          <SchemaPreview schema={schema} />
        </aside>
      </div>
    </section>
  );
}
