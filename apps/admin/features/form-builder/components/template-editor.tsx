"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { FormTemplate, FormSchema } from "@pilotforms/shared";
import { parseSchema } from "@pilotforms/shared";
import { updateTemplate } from "../actions";

interface Props {
  template: FormTemplate;
}

type FieldType = "text" | "numeric" | "date" | "time" | "dropdown" | "checkbox" | "signature" | "photo";

const FIELD_TYPE_OPTIONS: FieldType[] = [
  "text", "numeric", "date", "time", "dropdown", "checkbox", "signature", "photo",
];

export function TemplateEditor({ template }: Props) {
  const router = useRouter();
  const [schema, setSchema] = useState<FormSchema>(template.schema);
  const [schemaJson, setSchemaJson] = useState(() => JSON.stringify(schema, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeFieldIdx, setActiveFieldIdx] = useState<number | null>(null);

  const handleSchemaChange = useCallback((value: string) => {
    setSchemaJson(value);
    setError(null);
    try {
      const parsed = JSON.parse(value);
      const result = parseSchema(parsed);
      if (!result.success) {
        setError(result.error.message);
      } else {
        setSchema(result.data);
      }
    } catch {
      setError("Invalid JSON");
    }
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const parsed = JSON.parse(schemaJson);
      const result = parseSchema(parsed);
      if (!result.success) {
        setError(result.error.message);
        setSaving(false);
        return;
      }
      const state = await updateTemplate(
        { error: null, success: false },
        new FormData(),
      );
      if (state.error) {
        setError(state.error);
      } else {
        router.refresh();
      }
    } catch {
      setError("Invalid JSON");
    }
    setSaving(false);
  }

  const currentSection = schema.sections[activeSectionIdx];
  const activeField = activeFieldIdx !== null ? currentSection?.fields[activeFieldIdx] : null;

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-4 space-y-4">
        <SectionPanel
          sections={schema.sections}
          activeIdx={activeSectionIdx}
          onSelect={setActiveSectionIdx}
        />

        {currentSection && (
          <FieldList
            fields={currentSection.fields}
            activeIdx={activeFieldIdx}
            onSelect={setActiveFieldIdx}
          />
        )}
      </div>

      <div className="col-span-5 space-y-4">
        <div className="rounded-lg border border-runway-200 bg-white">
          <div className="border-b border-runway-200 px-4 py-3">
            <h3 className="text-sm font-medium text-runway-900">Schema JSON</h3>
          </div>
          <div className="p-4">
            <textarea
              value={schemaJson}
              onChange={(e) => handleSchemaChange(e.target.value)}
              className="h-96 w-full font-mono text-xs"
              spellCheck={false}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !!error}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="col-span-3 space-y-4">
        <MetadataPanel metadata={schema.metadata} />
        {activeField && (
          <FieldConfigPanel field={activeField} />
        )}
        <VersionInfo template={template} />
      </div>
    </div>
  );
}

function SectionPanel({
  sections,
  activeIdx,
  onSelect,
}: {
  sections: FormSchema["sections"];
  activeIdx: number;
  onSelect: (idx: number) => void;
}) {
  return (
    <div className="rounded-lg border border-runway-200 bg-white">
      <div className="border-b border-runway-200 px-4 py-3">
        <h3 className="text-sm font-medium text-runway-900">Sections</h3>
      </div>
      <ul className="divide-y divide-runway-100" role="list">
        {sections.map((s, i) => (
          <li key={s.id}>
            <button
              onClick={() => onSelect(i)}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                i === activeIdx
                  ? "bg-brand-50 font-medium text-brand-700"
                  : "text-runway-700 hover:bg-runway-50"
              }`}
            >
              <span className="block truncate">{s.title}</span>
              <span className="text-xs text-runway-500">{s.fields.length} fields</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FieldList({
  fields,
  activeIdx,
  onSelect,
}: {
  fields: FormSchema["sections"][number]["fields"];
  activeIdx: number | null;
  onSelect: (idx: number | null) => void;
}) {
  return (
    <div className="rounded-lg border border-runway-200 bg-white">
      <div className="border-b border-runway-200 px-4 py-3">
        <h3 className="text-sm font-medium text-runway-900">Fields</h3>
      </div>
      <ul className="divide-y divide-runway-100" role="list">
        {fields.map((f, i) => (
          <li key={f.id}>
            <button
              onClick={() => onSelect(i)}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                i === activeIdx
                  ? "bg-brand-50 font-medium text-brand-700"
                  : "text-runway-700 hover:bg-runway-50"
              }`}
            >
              <span className="flex items-center justify-between">
                <span className="truncate">{f.label}</span>
                <span className="ml-2 shrink-0 rounded bg-runway-100 px-1.5 py-0.5 text-xs text-runway-600">
                  {f.type}
                </span>
              </span>
              <span className="text-xs text-runway-400">
                {f.id}{f.required ? " • Required" : ""}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MetadataPanel({ metadata }: { metadata: FormSchema["metadata"] }) {
  return (
    <div className="rounded-lg border border-runway-200 bg-white">
      <div className="border-b border-runway-200 px-4 py-3">
        <h3 className="text-sm font-medium text-runway-900">Metadata</h3>
      </div>
      <dl className="divide-y divide-runway-100 px-4 py-2 text-sm">
        <div className="flex justify-between py-2">
          <dt className="text-runway-500">Form Type</dt>
          <dd className="font-medium text-runway-900">{metadata.formType}</dd>
        </div>
        <div className="flex justify-between py-2">
          <dt className="text-runway-500">Regulatory Basis</dt>
          <dd className="font-medium text-runway-900">
            {metadata.regulatoryBasis ?? "—"}
          </dd>
        </div>
        <div className="flex justify-between py-2">
          <dt className="text-runway-500">Est. Minutes</dt>
          <dd className="font-medium text-runway-900">{metadata.estimatedMinutes}</dd>
        </div>
      </dl>
    </div>
  );
}

function FieldConfigPanel({ field }: { field: FormSchema["sections"][number]["fields"][number] }) {
  return (
    <div className="rounded-lg border border-runway-200 bg-white">
      <div className="border-b border-runway-200 px-4 py-3">
        <h3 className="text-sm font-medium text-runway-900">
          {field.label}{" "}
          <span className="text-xs text-runway-500">({field.id})</span>
        </h3>
      </div>
      <dl className="divide-y divide-runway-100 px-4 py-2 text-sm">
        <div className="flex justify-between py-2">
          <dt className="text-runway-500">Type</dt>
          <dd className="rounded bg-runway-100 px-1.5 py-0.5 text-xs font-medium text-runway-700">
            {field.type}
          </dd>
        </div>
        <div className="flex justify-between py-2">
          <dt className="text-runway-500">Required</dt>
          <dd className="text-runway-900">{field.required ? "Yes" : "No"}</dd>
        </div>
        {"maxLength" in field && field.maxLength !== undefined && (
          <div className="flex justify-between py-2">
            <dt className="text-runway-500">Max Length</dt>
            <dd className="text-runway-900">{field.maxLength}</dd>
          </div>
        )}
        {"placeholder" in field && field.placeholder && (
          <div className="flex justify-between py-2">
            <dt className="text-runway-500">Placeholder</dt>
            <dd className="text-runway-900">{field.placeholder}</dd>
          </div>
        )}
        {"min" in field && field.min !== undefined && (
          <div className="flex justify-between py-2">
            <dt className="text-runway-500">Min</dt>
            <dd className="text-runway-900">{field.min}</dd>
          </div>
        )}
        {"max" in field && field.max !== undefined && (
          <div className="flex justify-between py-2">
            <dt className="text-runway-500">Max</dt>
            <dd className="text-runway-900">{field.max}</dd>
          </div>
        )}
        {"unit" in field && field.unit && (
          <div className="flex justify-between py-2">
            <dt className="text-runway-500">Unit</dt>
            <dd className="text-runway-900">{field.unit}</dd>
          </div>
        )}
        {"options" in field && field.options && (
          <div className="py-2">
            <dt className="mb-1 text-runway-500">Options</dt>
            <dd>
              <ul className="space-y-0.5">
                {field.options.map((o) => (
                  <li key={o} className="rounded bg-runway-50 px-2 py-1 text-xs text-runway-700">
                    {o}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}
        {"maxPhotos" in field && field.maxPhotos !== undefined && (
          <div className="flex justify-between py-2">
            <dt className="text-runway-500">Max Photos</dt>
            <dd className="text-runway-900">{field.maxPhotos}</dd>
          </div>
        )}
        {field.conditional && (
          <div className="py-2">
            <dt className="mb-1 text-runway-500">Conditional Rule</dt>
            <dd className="text-xs text-runway-700">
              when <strong>{field.conditional.fieldId}</strong>{" "}
              {field.conditional.operator} {String(field.conditional.value)}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function VersionInfo({ template }: { template: FormTemplate }) {
  return (
    <div className="rounded-lg border border-runway-200 bg-white">
      <div className="border-b border-runway-200 px-4 py-3">
        <h3 className="text-sm font-medium text-runway-900">Version History</h3>
      </div>
      <dl className="divide-y divide-runway-100 px-4 py-2 text-sm">
        <div className="flex justify-between py-2">
          <dt className="text-runway-500">Current Version</dt>
          <dd className="font-mono text-sm font-medium text-runway-900">
            v{template.version}
          </dd>
        </div>
        <div className="flex justify-between py-2">
          <dt className="text-runway-500">Created</dt>
          <dd className="text-runway-700">{template.createdAt.toLocaleDateString()}</dd>
        </div>
        <div className="flex justify-between py-2">
          <dt className="text-runway-500">Last Updated</dt>
          <dd className="text-runway-700">{template.updatedAt.toLocaleDateString()}</dd>
        </div>
        <div className="flex justify-between py-2">
          <dt className="text-runway-500">Status</dt>
          <dd>
            {template.deprecated ? (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                Deprecated
              </span>
            ) : template.isActive ? (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Published
              </span>
            ) : (
              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                Draft
              </span>
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}
