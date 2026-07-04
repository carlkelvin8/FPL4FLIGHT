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
import schemaJson from "./schema.json";
import { createParseError, type ParseError } from "./errors";

const ajv = new Ajv({
  allErrors: true,
  strict: false,
  validateSchema: false,
});
addFormats(ajv);

const validate = ajv.compile(schemaJson);

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

function isParseError(result: unknown): result is ParseError {
  return (
    typeof result === "object" &&
    result !== null &&
    "code" in result &&
    "message" in result
  );
}

export function parseTemplate(json: string): FormSchema | ParseError {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return createParseError(
      "TEMPLATE_INVALID_SCHEMA",
      "Invalid JSON syntax.",
    );
  }

  return parseSchema(parsed);
}

export function parseSchema(input: unknown): FormSchema | ParseError {
  if (!input || typeof input !== "object") {
    return createParseError(
      "TEMPLATE_INVALID_SCHEMA",
      "Schema must be a JSON object.",
    );
  }

  const valid = validate(input);
  if (!valid) {
    const first = validate.errors?.[0];
    return createParseError(
      "TEMPLATE_INVALID_SCHEMA",
      first?.message ?? "Schema validation failed.",
      first?.instancePath || undefined,
    );
  }

  const raw = input as unknown as RawSchema;

  const fieldIds = new Set<string>();
  const sections: FormSection[] = [];

  for (const sec of raw.sections) {
    const fields: FormField[] = [];

    for (const rawField of sec.fields) {
      if (fieldIds.has(rawField.id)) {
        return createParseError(
          "TEMPLATE_DUPLICATE_FIELD_ID",
          `Duplicate field id "${rawField.id}" in section "${sec.id}".`,
          `/sections/${sec.id}/fields/${rawField.id}`,
        );
      }
      fieldIds.add(rawField.id);

      const field = parseField(rawField);
      if (isParseError(field)) {
        return field;
      }
      fields.push(field);
    }

    sections.push({ id: sec.id, title: sec.title, fields });
  }

  return {
    sections,
    metadata: {
      formType: raw.metadata.formType,
      regulatoryBasis: raw.metadata.regulatoryBasis ?? null,
      estimatedMinutes: raw.metadata.estimatedMinutes ?? 0,
    },
  };
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

function parseField(raw: RawField): FormField | ParseError {
  if (!VALID_FIELD_TYPES.includes(raw.type as (typeof VALID_FIELD_TYPES)[number])) {
    return createParseError(
      "TEMPLATE_INVALID_FIELD_TYPE",
      `Unknown field type "${raw.type}". Supported types: ${VALID_FIELD_TYPES.join(", ")}`,
    );
  }

  const base = {
    id: raw.id,
    label: raw.label,
    required: raw.required ?? false,
    conditional: raw.conditional
      ? ({
          fieldId: raw.conditional.fieldId,
          operator: raw.conditional.operator as ConditionalRule["operator"],
          value: raw.conditional.value,
        } as ConditionalRule)
      : undefined,
  };

  switch (raw.type) {
    case "text":
      return {
        ...base,
        type: "text" as const,
        maxLength: raw.maxLength,
        placeholder: raw.placeholder,
      } as TextField;
    case "numeric":
      return {
        ...base,
        type: "numeric" as const,
        min: raw.min,
        max: raw.max,
        unit: raw.unit,
      } as NumericField;
    case "date":
      return { ...base, type: "date" as const } as DateField;
    case "time":
      return { ...base, type: "time" as const } as TimeField;
    case "dropdown":
      return {
        ...base,
        type: "dropdown" as const,
        options: raw.options ?? [],
      } as DropdownField;
    case "checkbox":
      return { ...base, type: "checkbox" as const } as CheckboxField;
    case "signature":
      return { ...base, type: "signature" as const } as SignatureField;
    case "photo":
      return {
        ...base,
        type: "photo" as const,
        maxPhotos: raw.maxPhotos ?? 10,
      } as PhotoField;
    default:
      return createParseError(
        "TEMPLATE_INVALID_FIELD_TYPE",
        `Unknown field type "${raw.type}".`,
      );
  }
}
