import type { IFormTemplateRepository , Result, FormTemplate, FormSchema } from "@pilotforms/shared";
import { ok, err } from "@pilotforms/shared";

import { supabase } from "@core/network";

interface FormTemplateRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  version: number;
  schema: FormSchema;
  is_active: boolean;
  deprecated: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  usage_count?: number;
}

function rowToTemplate(row: FormTemplateRow): FormTemplate {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    version: row.version,
    schema: row.schema,
    isActive: row.is_active,
    deprecated: row.deprecated,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class FormTemplateRepository implements IFormTemplateRepository {
  async findAll(): Promise<Result<FormTemplate[]>> {
    try {
      const { data, error } = await supabase
        .from("form_templates")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) return err("DB_ERROR", error.message, error);
      return ok((data ?? []).map(rowToTemplate));
    } catch (e) {
      return err("NETWORK_ERROR", "Network error fetching templates.", e);
    }
  }

  async findById(id: string): Promise<Result<FormTemplate>> {
    try {
      const response = await supabase
        .from("form_templates")
        .select("*")
        .eq("id", id)
        .single();

      if (response.error) return err("NOT_FOUND", response.error.message, response.error);
      return ok(rowToTemplate(response.data as FormTemplateRow));
    } catch (e) {
      return err("NETWORK_ERROR", "Network error fetching template.", e);
    }
  }

  async findByVersion(id: string, version: number): Promise<Result<FormTemplate>> {
    try {
      const response = await supabase
        .from("form_templates")
        .select("*")
        .eq("id", id)
        .eq("version", version)
        .single();

      if (response.error) return err("NOT_FOUND", response.error.message, response.error);
      return ok(rowToTemplate(response.data as FormTemplateRow));
    } catch (e) {
      return err("NETWORK_ERROR", "Network error fetching template version.", e);
    }
  }
}

export const formTemplateRepository = new FormTemplateRepository();
