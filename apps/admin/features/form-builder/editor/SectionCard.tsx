"use client";

import { useState } from "react";
import type { FormSection } from "@pilotforms/shared";
import type { FormSchema, FieldOption, FieldType } from "../schema-builder";
import {
  FIELD_TYPES,
  FIELD_TYPE_LABELS,
  renameSection,
  removeSection,
  moveSection,
  addField,
} from "../schema-builder";
import { FieldRow } from "./FieldRow";

const inputClass =
  "w-full rounded-lg border border-runway-300 bg-white px-3 py-2 text-sm text-runway-900 placeholder-runway-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

interface SectionCardProps {
  schema: FormSchema;
  section: FormSection;
  sectionIndex: number;
  totalSections: number;
  conditionalOptions: FieldOption[];
  onChange: (schema: FormSchema) => void;
}

export function SectionCard({
  schema,
  section,
  sectionIndex,
  totalSections,
  conditionalOptions,
  onChange,
}: SectionCardProps) {
  const [addType, setAddType] = useState<FieldType>("text");

  return (
    <div className="rounded-xl border border-runway-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-runway-100 p-4 sm:flex-row sm:items-center">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-runway-100 font-semibold text-runway-500">
          {sectionIndex + 1}
        </div>
        <input
          type="text"
          value={section.title}
          onChange={(e) => onChange(renameSection(schema, section.id, e.target.value))}
          placeholder="Section title"
          className={`${inputClass} flex-1 font-medium`}
        />
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            disabled={sectionIndex === 0}
            onClick={() => onChange(moveSection(schema, section.id, -1))}
            title="Move section up"
            className="rounded-lg p-2 text-runway-400 transition-colors hover:bg-runway-100 hover:text-runway-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
          </button>
          <button
            type="button"
            disabled={sectionIndex === totalSections - 1}
            onClick={() => onChange(moveSection(schema, section.id, 1))}
            title="Move section down"
            className="rounded-lg p-2 text-runway-400 transition-colors hover:bg-runway-100 hover:text-runway-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
          <button
            type="button"
            disabled={totalSections === 1}
            onClick={() => onChange(removeSection(schema, section.id))}
            title="Delete section"
            className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {section.fields.length === 0 && (
          <p className="rounded-lg border border-dashed border-runway-300 px-4 py-6 text-center text-sm text-runway-400">
            No fields yet — add one below.
          </p>
        )}

        {section.fields.map((field, i) => (
          <FieldRow
            key={field.id}
            schema={schema}
            sectionId={section.id}
            field={field}
            fieldIndex={i}
            totalFields={section.fields.length}
            conditionalOptions={conditionalOptions.filter((o) => o.id !== field.id)}
            onChange={onChange}
          />
        ))}

        <div className="flex items-center gap-2 pt-1">
          <select
            value={addType}
            onChange={(e) => setAddType(e.target.value as FieldType)}
            className="rounded-lg border border-runway-300 bg-white px-3 py-2 text-sm text-runway-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onChange(addField(schema, section.id, addType))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-brand-400 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-100"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
            Add field
          </button>
        </div>
      </div>
    </div>
  );
}
