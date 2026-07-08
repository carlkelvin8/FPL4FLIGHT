import Ajv from "ajv";
import addFormats from "ajv-formats";

import type {
  FormSchema,
  FormSection,
  FormField,
  TextField,
  NumericField,
  DateField,
  TimeField,
  DropdownField,
  CheckboxField,
  SignatureField,
  PhotoField,
  ConditionalRule,
} from "../entities/form";

import { createParseError, type ParseError } from "./errors";
import schemaJson from "./schema.json";
import { err, ok, type Result } from "../types/result";

let ajvInstance: Ajv | null = null;
let validateFn: ReturnType<Ajv["compile"]> | null = null;

function getValidator(): { validate: ReturnType<Ajv["compile"]>; ajv: Ajv } {
  if (!ajvInstance) {
    ajvInstance = new Ajv({
      allErrors: true,
      strict: true,
      validateSchema: true,
    });
    addFormats(ajvInstance);
    validateFn = ajvInstance.compile(schemaJson);
  }
  return { validate: validateFn!, ajv: ajvInstance };
}

interface RawField {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  conditional?: {
    fieldId: string;
    operator: string;
    value: string | number | boolean;
  };
  maxLength?: number;
  placeholder?: string;
  min?: number;
  max?: number;
  unit?: string;
  options?: string[];
  maxPhotos?: number;
}

interface RawSection {
  id: string;
  title: string;
  fields: RawField[];
}

interface RawSchema {
  sections: RawSection[];
  metadata: {
    formType: string;
    regulatoryBasis?: string | null;
    estimatedMinutes?: number;
  };
}

const VALID_OPERATORS: ConditionalRule["operator"][] = [
  "equals", "not_equals", "contains", "greater_than",
];

function isValidOperator(v: string): v is ConditionalRule["operator"] {
  return VALID_OPERATORS.includes(v as ConditionalRule["operator"]);
}

function parseConditional(raw: RawField["conditional"]): ConditionalRule | undefined {
  if (!raw) return undefined;
  if (!isValidOperator(raw.operator)) return undefined;
  return {
    fieldId: raw.fieldId,
    operator: raw.operator,
    value: raw.value,
  };
}

export function parseTemplate(json: string): Result<FormSchema> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return err("TEMPLATE_INVALID_SCHEMA", "Invalid JSON syntax.");
  }

  return parseSchema(parsed);
}

export function parseSchema(input: unknown): Result<FormSchema> {
  if (!input || typeof input !== "object") {
    return err("TEMPLATE_INVALID_SCHEMA", "Schema must be a JSON object.");
  }

  const { validate } = getValidator();
  const valid = validate(input);
  if (!valid) {
    const first = validate.errors?.[0];
    return err(
      "TEMPLATE_INVALID_SCHEMA",
      first?.message ?? "Schema validation failed.",
      first?.instancePath || undefined,
    );
  }

  const raw = input as RawSchema;

  const sectionIds = new Set<string>();
  const fieldIds = new Set<string>();
  const sections: FormSection[] = [];

  for (const sec of raw.sections) {
    if (sectionIds.has(sec.id)) {
      return err(
        "TEMPLATE_DUPLICATE_SECTION_ID",
        `Duplicate section id "${sec.id}".`,
        `/sections/${sec.id}`,
      );
    }
    sectionIds.add(sec.id);

    const fields: FormField[] = [];

    for (const rawField of sec.fields) {
      if (fieldIds.has(rawField.id)) {
        return err(
          "TEMPLATE_DUPLICATE_FIELD_ID",
          `Duplicate field id "${rawField.id}" in section "${sec.id}".`,
          `/sections/${sec.id}/fields/${rawField.id}`,
        );
      }
      fieldIds.add(rawField.id);

      const fieldResult = parseField(rawField);
      if (!fieldResult.success) {
        return fieldResult;
      }
      fields.push(fieldResult.data);
    }

    sections.push({ id: sec.id, title: sec.title, fields });
  }

  // Cross-field reference validation
  for (const sec of sections) {
    for (const field of sec.fields) {
      if (field.conditional) {
        if (!fieldIds.has(field.conditional.fieldId)) {
          return err(
            "TEMPLATE_INVALID_CROSS_FIELD_REFERENCE",
            `Conditional rule in field "${field.id}" references non-existent field "${field.conditional.fieldId}".`,
            `/sections/${sec.id}/fields/${field.id}/conditional/fieldId`,
          );
        }
      }
    }
  }

  return ok({
    sections,
    metadata: {
      formType: raw.metadata.formType,
      regulatoryBasis: raw.metadata.regulatoryBasis ?? null,
      estimatedMinutes: raw.metadata.estimatedMinutes ?? 0,
    },
  });
}

const VALID_FIELD_TYPES = [
  "text",
  "numeric",
  "date",
  "time",
  "dropdown",
  "checkbox",
  "signature",
  "photo",
] as const;

function parseField(raw: RawField): Result<FormField> {
  if (!VALID_FIELD_TYPES.includes(raw.type as (typeof VALID_FIELD_TYPES)[number])) {
    return err(
      "TEMPLATE_INVALID_FIELD_TYPE",
      `Unknown field type "${raw.type}". Supported types: ${VALID_FIELD_TYPES.join(", ")}`,
    );
  }

  const base = {
    id: raw.id,
    label: raw.label,
    required: raw.required ?? false,
    conditional: parseConditional(raw.conditional),
  };

  switch (raw.type) {
    case "text":
      return ok({
        ...base,
        type: "text" as const,
        maxLength: raw.maxLength,
        placeholder: raw.placeholder,
      } as TextField);
    case "numeric":
      return ok({
        ...base,
        type: "numeric" as const,
        min: raw.min,
        max: raw.max,
        unit: raw.unit,
      } as NumericField);
    case "date":
      return ok({ ...base, type: "date" as const } as DateField);
    case "time":
      return ok({ ...base, type: "time" as const } as TimeField);
    case "dropdown":
      return ok({
        ...base,
        type: "dropdown" as const,
        options: raw.options ?? [],
      } as DropdownField);
    case "checkbox":
      return ok({ ...base, type: "checkbox" as const } as CheckboxField);
    case "signature":
      return ok({ ...base, type: "signature" as const } as SignatureField);
    case "photo":
      return ok({
        ...base,
        type: "photo" as const,
        maxPhotos: raw.maxPhotos ?? 10,
      } as PhotoField);
    default:
      return err(
        "TEMPLATE_INVALID_FIELD_TYPE",
        `Unknown field type "${raw.type}".`,
      );
  }
}
