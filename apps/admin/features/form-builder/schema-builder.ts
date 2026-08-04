/**
 * Pure domain helpers for the template schema editor.
 *
 * All functions are immutable — they return a new schema instead of mutating
 * the input. This module has no React or network dependencies so it can be
 * unit-tested in isolation.
 */

import type {
  FormSchema,
  FormSection,
  FormField,
  ConditionalRule,
} from "@pilotforms/shared";

export type { FormSchema, FormSection, FormField, ConditionalRule } from "@pilotforms/shared";

export type FieldType = FormField["type"];

export interface SerializedTemplate {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  version: number;
  schema: FormSchema;
  isActive: boolean;
  deprecated: boolean;
  createdAt: string;
  updatedAt: string;
}

export const FIELD_TYPES: FieldType[] = [
  "text",
  "numeric",
  "date",
  "time",
  "dropdown",
  "checkbox",
  "signature",
  "photo",
];

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "Text",
  numeric: "Number",
  date: "Date",
  time: "Time",
  dropdown: "Dropdown",
  checkbox: "Checkbox",
  signature: "Signature",
  photo: "Photo",
};

export const CONDITIONAL_OPERATORS: ConditionalRule["operator"][] = [
  "equals",
  "not_equals",
  "contains",
  "greater_than",
];

export const CONDITIONAL_OPERATOR_LABELS: Record<ConditionalRule["operator"], string> = {
  equals: "equals",
  not_equals: "does not equal",
  contains: "contains",
  greater_than: "is greater than",
};

let idCounter = 0;

/** Generate a collision-resistant id for sections and fields. */
export function createId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${idCounter}${Math.random().toString(36).slice(2, 6)}`;
}

const fieldFactories: Record<FieldType, (id: string, label: string) => FormField> = {
  text: (id, label) => ({ id, label, required: false, type: "text" }),
  numeric: (id, label) => ({ id, label, required: false, type: "numeric" }),
  date: (id, label) => ({ id, label, required: false, type: "date" }),
  time: (id, label) => ({ id, label, required: false, type: "time" }),
  dropdown: (id, label) => ({ id, label, required: false, type: "dropdown", options: [] }),
  checkbox: (id, label) => ({ id, label, required: false, type: "checkbox" }),
  signature: (id, label) => ({ id, label, required: false, type: "signature" }),
  photo: (id, label) => ({ id, label, required: false, type: "photo", maxPhotos: 10 }),
};

/** Create a new field of the given type with sensible defaults. */
export function createField(type: FieldType): FormField {
  return fieldFactories[type](createId("fld"), `Untitled ${FIELD_TYPE_LABELS[type].toLowerCase()}`);
}

/** Replace a field with a new type, preserving id, label, required, conditional. */
export function changeFieldType(field: FormField, newType: FieldType): FormField {
  if (field.type === newType) return field;
  const next = {
    ...fieldFactories[newType](field.id, field.label),
    required: field.required,
  };
  if (field.conditional) {
    (next as { conditional?: ConditionalRule }).conditional = field.conditional;
  }
  return next as FormField;
}

/** Valid starter schema used when creating a template from scratch. */
export function createDefaultSchema(): FormSchema {
  return {
    sections: [
      { id: createId("sec"), title: "Section 1", fields: [createField("text")] },
    ],
    metadata: {
      formType: "general",
      regulatoryBasis: null,
      estimatedMinutes: 0,
    },
  };
}

export function updateSchemaMetadata(
  schema: FormSchema,
  patch: Partial<FormSchema["metadata"]>,
): FormSchema {
  return { ...schema, metadata: { ...schema.metadata, ...patch } };
}

// ---------------------------------------------------------------------------
// Section operations
// ---------------------------------------------------------------------------

export function renameSection(schema: FormSchema, sectionId: string, title: string): FormSchema {
  return {
    ...schema,
    sections: schema.sections.map((s) => (s.id === sectionId ? { ...s, title } : s)),
  };
}

export function addSection(schema: FormSchema, title = `Section ${schema.sections.length + 1}`): FormSchema {
  return { ...schema, sections: [...schema.sections, { id: createId("sec"), title, fields: [] }] };
}

export function removeSection(schema: FormSchema, sectionId: string): FormSchema {
  return { ...schema, sections: schema.sections.filter((s) => s.id !== sectionId) };
}

export function moveSection(schema: FormSchema, sectionId: string, direction: -1 | 1): FormSchema {
  const index = schema.sections.findIndex((s) => s.id === sectionId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= schema.sections.length) return schema;
  const sections = [...schema.sections];
  const moving = sections[index]!;
  sections[index] = sections[target]!;
  sections[target] = moving;
  return { ...schema, sections };
}

// ---------------------------------------------------------------------------
// Field operations
// ---------------------------------------------------------------------------

export function addField(schema: FormSchema, sectionId: string, type: FieldType): FormSchema {
  return {
    ...schema,
    sections: schema.sections.map((s) =>
      s.id === sectionId ? { ...s, fields: [...s.fields, createField(type)] } : s,
    ),
  };
}

export function removeField(schema: FormSchema, sectionId: string, fieldId: string): FormSchema {
  return {
    ...schema,
    sections: schema.sections.map((s) => ({
      ...s,
      fields: s.fields
        .filter((f) => !(s.id === sectionId && f.id === fieldId))
        .map((f) => {
          if (f.conditional && f.conditional.fieldId === fieldId) {
            const { conditional: _dropped, ...rest } = f;
            return rest;
          }
          return f;
        }),
    })),
  };
}

export function moveField(
  schema: FormSchema,
  sectionId: string,
  fieldId: string,
  direction: -1 | 1,
): FormSchema {
  return {
    ...schema,
    sections: schema.sections.map((s) => {
      if (s.id !== sectionId) return s;
      const index = s.fields.findIndex((f) => f.id === fieldId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= s.fields.length) return s;
      const fields = [...s.fields];
      const moving = fields[index]!;
      fields[index] = fields[target]!;
      fields[target] = moving;
      return { ...s, fields };
    }),
  };
}

export type FieldPatch = Partial<
  Pick<FormField, "label" | "required"> & {
    maxLength: number | null;
    placeholder: string;
    min: number | null;
    max: number | null;
    unit: string;
    options: string[];
    maxPhotos: number;
    conditional: ConditionalRule | null;
  }
>;

export function updateFieldProps(
  schema: FormSchema,
  sectionId: string,
  fieldId: string,
  patch: FieldPatch,
): FormSchema {
  return {
    ...schema,
    sections: schema.sections.map((s) =>
      s.id === sectionId
        ? { ...s, fields: s.fields.map((f) => (f.id === fieldId ? mergeFieldPatch(f, patch) : f)) }
        : s,
    ),
  };
}

export function setFieldType(
  schema: FormSchema,
  sectionId: string,
  fieldId: string,
  newType: FieldType,
): FormSchema {
  return {
    ...schema,
    sections: schema.sections.map((s) =>
      s.id === sectionId
        ? { ...s, fields: s.fields.map((f) => (f.id === fieldId ? changeFieldType(f, newType) : f)) }
        : s,
    ),
  };
}

function mergeFieldPatch(field: FormField, patch: FieldPatch): FormField {
  const next: Record<string, unknown> = { ...field, ...patch };
  for (const key of ["conditional", "maxLength", "min", "max", "placeholder", "unit"] as const) {
    if (next[key] === null || next[key] === "") delete next[key];
  }
  return next as unknown as FormField;
}

// ---------------------------------------------------------------------------
// Conditionals
// ---------------------------------------------------------------------------

export interface FieldOption {
  id: string;
  label: string;
  sectionTitle: string;
}

/** All fields in the schema (used as targets for conditional rules). */
export function allFields(schema: FormSchema): FieldOption[] {
  return schema.sections.flatMap((s) =>
    s.fields.map((f) => ({ id: f.id, label: f.label, sectionTitle: s.title })),
  );
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface SchemaValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Client-side validation mirroring the shared @pilotforms/shared schema rules.
 * The server re-validates on save; this only prevents obvious mistakes early.
 */
export function validateSchema(schema: FormSchema): SchemaValidation {
  const errors: string[] = [];

  if (!schema.metadata.formType.trim()) {
    errors.push("Form type is required (set it in Template Details).");
  }
  if (schema.metadata.estimatedMinutes < 0) {
    errors.push("Estimated minutes cannot be negative.");
  }
  if (schema.sections.length === 0) {
    errors.push("Add at least one section.");
  }

  const fieldIds = new Set<string>();
  schema.sections.forEach((section, sectionIndex) => {
    const sectionLabel = section.title.trim() || `Section ${sectionIndex + 1}`;
    if (!section.title.trim()) errors.push(`${sectionLabel}: section title is required.`);
    if (section.fields.length === 0) {
      errors.push(`${sectionLabel}: add at least one field.`);
    }

    section.fields.forEach((field) => {
      if (fieldIds.has(field.id)) errors.push(`Duplicate field id "${field.id}".`);
      fieldIds.add(field.id);

      const fieldLabel = field.label.trim() || field.id;
      if (!field.label.trim()) errors.push(`${sectionLabel}: every field needs a label.`);
      if (field.type === "dropdown" && field.options.length === 0) {
        errors.push(`"${fieldLabel}": dropdown needs at least one option.`);
      }
      if (field.type === "photo" && (field.maxPhotos ?? 10) < 1) {
        errors.push(`"${fieldLabel}": max photos must be at least 1.`);
      }
      if (field.conditional && !fieldIds.has(field.conditional.fieldId)) {
        errors.push(`"${fieldLabel}": conditional rule references a missing field.`);
      }
    });
  });

  return { valid: errors.length === 0, errors };
}

/** Human-friendly summary used for stat chips. */
export function summarizeSchema(schema: FormSchema): { sections: number; fields: number } {
  return {
    sections: schema.sections.length,
    fields: schema.sections.reduce((acc, s) => acc + s.fields.length, 0),
  };
}
