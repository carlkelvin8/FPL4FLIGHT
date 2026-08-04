"use client";

import type { FormField, FormSchema } from "@pilotforms/shared";
import { FIELD_TYPE_LABELS } from "../schema-builder";

const inputClass =
  "w-full rounded-lg border border-runway-300 bg-white px-3 py-2 text-sm text-runway-900 placeholder-runway-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-runway-100 disabled:text-runway-500";

function PreviewInput({ field }: { field: FormField }) {
  switch (field.type) {
    case "text":
      return <input type="text" disabled placeholder={field.placeholder ?? ""} className={inputClass} />;
    case "numeric":
      return <input type="number" disabled placeholder={field.unit ? `In ${field.unit}` : ""} className={inputClass} />;
    case "date":
      return <input type="date" disabled className={inputClass} />;
    case "time":
      return <input type="time" disabled className={inputClass} />;
    case "dropdown":
      return (
        <select disabled className={inputClass}>
          <option>Select…</option>
          {field.options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      );
    case "checkbox":
      return (
        <label className="flex items-center gap-2 text-sm text-runway-700">
          <input type="checkbox" disabled className="h-4 w-4 rounded border-runway-300" />
          {field.label}
        </label>
      );
    case "signature":
      return (
        <div className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-runway-300 bg-runway-50 text-xs text-runway-400">
          Signature capture
        </div>
      );
    case "photo":
      return (
        <div className="flex h-16 items-center justify-center rounded-lg border-2 border-dashed border-runway-300 bg-runway-50 text-xs text-runway-400">
          {field.maxPhotos ?? 10} photo{field.maxPhotos === 1 ? "" : "s"}
        </div>
      );
  }
}

export function SchemaPreview({ schema }: { schema: FormSchema }) {
  return (
    <div className="rounded-xl border border-runway-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-runway-900">Form Preview</p>
        <span className="rounded-full bg-runway-100 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-runway-500">
          {schema.metadata.formType}
        </span>
      </div>

      {schema.metadata.estimatedMinutes > 0 && (
        <p className="mb-4 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
          Estimated completion: ~{schema.metadata.estimatedMinutes} min
        </p>
      )}

      {schema.sections.length === 0 && (
        <p className="py-8 text-center text-sm text-runway-400">Add a section to start building.</p>
      )}

      <div className="space-y-6">
        {schema.sections.map((section, i) => (
          <div key={section.id}>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-runway-900">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-runway-100 text-[10px] font-bold text-runway-500">{i + 1}</span>
              {section.title || "Untitled section"}
            </h3>
            {section.fields.length === 0 && (
              <p className="text-xs text-runway-400">No fields.</p>
            )}
            <div className="space-y-3">
              {section.fields.map((field) => (
                <div key={field.id}>
                  {field.type === "checkbox" ? (
                    <PreviewInput field={field} />
                  ) : (
                    <>
                      <label className="mb-1 block text-xs font-medium text-runway-700">
                        {field.label || "Untitled field"}
                        {field.required && <span className="ml-0.5 text-red-500">*</span>}
                        <span className="ml-2 font-normal text-runway-400">{FIELD_TYPE_LABELS[field.type]}</span>
                      </label>
                      <PreviewInput field={field} />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
