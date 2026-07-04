import type { FormTemplate, FormSchema, FormSection, FormField } from "../entities/form";

interface SerializedSchema {
  sections: SerializedSection[];
  metadata: {
    formType: string;
    regulatoryBasis: string | null;
    estimatedMinutes: number;
  };
}

interface SerializedSection {
  id: string;
  title: string;
  fields: Record<string, unknown>[];
}

export function formatTemplate(template: FormTemplate): object {
  return {
    id: template.id,
    slug: template.slug,
    name: template.name,
    description: template.description,
    version: template.version,
    schema: formatSchema(template.schema),
    isActive: template.isActive,
    deprecated: template.deprecated,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

export function formatSchema(schema: FormSchema): SerializedSchema {
  return {
    sections: schema.sections.map(serializeSection),
    metadata: {
      formType: schema.metadata.formType,
      regulatoryBasis: schema.metadata.regulatoryBasis,
      estimatedMinutes: schema.metadata.estimatedMinutes,
    },
  };
}

function serializeSection(section: FormSection): SerializedSection {
  return {
    id: section.id,
    title: section.title,
    fields: section.fields.map(serializeField),
  };
}

function serializeField(field: FormField): Record<string, unknown> {
  const base: Record<string, unknown> = {
    id: field.id,
    label: field.label,
    type: field.type,
    required: field.required,
  };

  if (field.conditional) {
    base.conditional = {
      fieldId: field.conditional.fieldId,
      operator: field.conditional.operator,
      value: field.conditional.value,
    };
  }

  switch (field.type) {
    case "text":
      if (field.maxLength !== undefined) base.maxLength = field.maxLength;
      if (field.placeholder !== undefined) base.placeholder = field.placeholder;
      break;
    case "numeric":
      if (field.min !== undefined) base.min = field.min;
      if (field.max !== undefined) base.max = field.max;
      if (field.unit !== undefined) base.unit = field.unit;
      break;
    case "dropdown":
      base.options = field.options;
      break;
    case "photo":
      base.maxPhotos = field.maxPhotos;
      break;
  }

  return base;
}
