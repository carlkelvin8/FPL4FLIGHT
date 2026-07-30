/**
 * Form-related domain entities — framework agnostic, no external dependencies.
 */

export interface FormTemplate {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  version: number;
  schema: FormSchema;
  isActive: boolean;
  deprecated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormSchema {
  sections: FormSection[];
  metadata: FormMetadata;
}

export interface FormMetadata {
  /** Category/type of aviation form (e.g. "pre-flight", "maintenance", "incident") */
  formType: string;
  /** Regulatory basis for this form (e.g. "FAR 91.409", "ICAO Annex 6") */
  regulatoryBasis: string | null;
  /** Estimated time in minutes for a pilot to complete the form */
  estimatedMinutes: number;
}

export interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
}

export type FormField =
  | TextField
  | NumericField
  | DateField
  | TimeField
  | DropdownField
  | CheckboxField
  | SignatureField
  | PhotoField;

export interface BaseField {
  id: string;
  label: string;
  required: boolean;
  conditional?: ConditionalRule;
}

export interface TextField extends BaseField {
  type: "text";
  maxLength?: number;
  placeholder?: string;
}

export interface NumericField extends BaseField {
  type: "numeric";
  min?: number;
  max?: number;
  unit?: string;
}

export interface DateField extends BaseField {
  type: "date";
}

export interface TimeField extends BaseField {
  type: "time";
}

export interface DropdownField extends BaseField {
  type: "dropdown";
  options: string[];
}

export interface CheckboxField extends BaseField {
  type: "checkbox";
}

export interface SignatureField extends BaseField {
  type: "signature";
}

export interface PhotoField extends BaseField {
  type: "photo";
  maxPhotos: number;
}

export interface ConditionalRule {
  fieldId: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than";
  value: string | number | boolean;
}

export interface FormInstance {
  id: string;
  userId: string;
  templateId: string;
  templateVersion: number;
  status: "draft" | "completed" | "synced";
  data: Record<string, FieldValue>;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type FieldValue =
  | string
  | number
  | boolean
  | string[]
  | SignatureData
  | PhotoData[];

export interface SignatureData {
  storagePath: string;
  capturedAt: Date;
}

export interface PhotoData {
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
}
