"use client";

import type { FormField, ConditionalRule } from "@pilotforms/shared";
import type { FormSchema, FieldOption, FieldType } from "../schema-builder";
import {
  FIELD_TYPES,
  FIELD_TYPE_LABELS,
  CONDITIONAL_OPERATORS,
  CONDITIONAL_OPERATOR_LABELS,
  setFieldType,
  updateFieldProps,
  moveField,
  removeField,
} from "../schema-builder";

const inputClass =
  "w-full rounded-lg border border-runway-300 bg-white px-3 py-2 text-sm text-runway-900 placeholder-runway-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

interface FieldRowProps {
  schema: FormSchema;
  sectionId: string;
  field: FormField;
  fieldIndex: number;
  totalFields: number;
  conditionalOptions: FieldOption[];
  onChange: (schema: FormSchema) => void;
}

const TYPE_ICONS: Record<FieldType, string> = {
  text: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
  numeric: "M4 7h16M4 12h16M4 17h16",
  date: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  time: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  dropdown: "M8 9l4-4 4 4m0 6l-4 4-4-4",
  checkbox: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
  signature: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
  photo: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
};

function parseOptionalNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function FieldRow({
  schema,
  sectionId,
  field,
  fieldIndex,
  totalFields,
  conditionalOptions,
  onChange,
}: FieldRowProps) {
  const patch = (p: Parameters<typeof updateFieldProps>[3]) =>
    onChange(updateFieldProps(schema, sectionId, field.id, p));

  const updateConditional = (next: ConditionalRule | null) => patch({ conditional: next });

  return (
    <div className="rounded-lg border border-runway-200 bg-runway-50/50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d={TYPE_ICONS[field.type]} />
          </svg>
        </div>

        <select
          value={field.type}
          onChange={(e) => onChange(setFieldType(schema, sectionId, field.id, e.target.value as FieldType))}
          className="w-32 rounded-lg border border-runway-300 bg-white px-2.5 py-2 text-sm font-medium text-runway-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          {FIELD_TYPES.map((t) => (
            <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
          ))}
        </select>

        <input
          type="text"
          value={field.label}
          onChange={(e) => patch({ label: e.target.value })}
          placeholder="Field label"
          className={`${inputClass} flex-1`}
        />

        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm font-medium text-runway-700">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => patch({ required: e.target.checked })}
            className="rounded border-runway-300 text-brand-600 focus:ring-brand-500"
          />
          Required
        </label>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            disabled={fieldIndex === 0}
            onClick={() => onChange(moveField(schema, sectionId, field.id, -1))}
            title="Move up"
            className="rounded-lg p-1.5 text-runway-400 transition-colors hover:bg-runway-100 hover:text-runway-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
          </button>
          <button
            type="button"
            disabled={fieldIndex === totalFields - 1}
            onClick={() => onChange(moveField(schema, sectionId, field.id, 1))}
            title="Move down"
            className="rounded-lg p-1.5 text-runway-400 transition-colors hover:bg-runway-100 hover:text-runway-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
          <button
            type="button"
            onClick={() => onChange(removeField(schema, sectionId, field.id))}
            title="Delete field"
            className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {field.type === "text" && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-runway-500">Max length</label>
              <input
                type="number"
                min={1}
                value={field.maxLength ?? ""}
                onChange={(e) => patch({ maxLength: parseOptionalNumber(e.target.value) })}
                placeholder="Unlimited"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-runway-500">Placeholder</label>
              <input
                type="text"
                value={field.placeholder ?? ""}
                onChange={(e) => patch({ placeholder: e.target.value })}
                placeholder="e.g. RP-C1234"
                className={inputClass}
              />
            </div>
          </>
        )}

        {field.type === "numeric" && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-runway-500">Min</label>
              <input type="number" value={field.min ?? ""} onChange={(e) => patch({ min: parseOptionalNumber(e.target.value) })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-runway-500">Max</label>
              <input type="number" value={field.max ?? ""} onChange={(e) => patch({ max: parseOptionalNumber(e.target.value) })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-runway-500">Unit</label>
              <input type="text" value={field.unit ?? ""} onChange={(e) => patch({ unit: e.target.value })} placeholder="e.g. kg, ft, min" className={inputClass} />
            </div>
          </>
        )}

        {field.type === "dropdown" && (
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="mb-1 block text-xs font-medium text-runway-500">
              Options <span className="text-runway-400">(one per line)</span>
            </label>
            <textarea
              value={field.options.join("\n")}
              onChange={(e) => patch({ options: e.target.value.split("\n").map((o) => o.trim()).filter(Boolean) })}
              rows={3}
              placeholder={"Option one\nOption two"}
              className={`${inputClass} resize-none`}
            />
          </div>
        )}

        {field.type === "photo" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-runway-500">Max photos</label>
            <input type="number" min={1} value={field.maxPhotos ?? 10} onChange={(e) => patch({ maxPhotos: Math.max(1, Number(e.target.value) || 1) })} className={inputClass} />
          </div>
        )}
      </div>

      <div className="mt-3 border-t border-runway-200 pt-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-runway-700">
          <input
            type="checkbox"
            checked={Boolean(field.conditional)}
            onChange={(e) => {
              if (e.target.checked) {
                const target = conditionalOptions[0];
                updateConditional(target
                  ? { fieldId: target.id, operator: "equals", value: "" }
                  : null);
              } else {
                updateConditional(null);
              }
            }}
            className="rounded border-runway-300 text-brand-600 focus:ring-brand-500"
          />
          Show only when another field matches
        </label>

        {field.conditional && (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select
              value={field.conditional.fieldId}
              onChange={(e) => updateConditional({ ...field.conditional!, fieldId: e.target.value })}
              className={inputClass}
            >
              {conditionalOptions.length === 0 && <option value="">No other fields</option>}
              {conditionalOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label} ({opt.sectionTitle})
                </option>
              ))}
            </select>
            <select
              value={field.conditional.operator}
              onChange={(e) => updateConditional({ ...field.conditional!, operator: e.target.value as ConditionalRule["operator"] })}
              className={inputClass}
            >
              {CONDITIONAL_OPERATORS.map((op) => (
                <option key={op} value={op}>{CONDITIONAL_OPERATOR_LABELS[op]}</option>
              ))}
            </select>
            <input
              type="text"
              value={String(field.conditional.value ?? "")}
              onChange={(e) => updateConditional({ ...field.conditional!, value: e.target.value })}
              placeholder="Value"
              className={inputClass}
            />
          </div>
        )}
      </div>
    </div>
  );
}
