import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FormTemplate } from "@pilotforms/shared";
import { parseSchema, formatSchema } from "@pilotforms/shared";

interface TemplateRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  version: number;
  schema: unknown;
  is_active: boolean;
  deprecated: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

function rowToEntity(row: TemplateRow): FormTemplate {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    version: row.version,
    schema: row.schema as FormTemplate["schema"],
    isActive: row.is_active,
    deprecated: row.deprecated,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export type CreateTemplateInput = {
  slug: string;
  name: string;
  description?: string;
  schema: Record<string, unknown>;
};

export type UpdateTemplateInput = {
  name?: string;
  description?: string;
  schema?: Record<string, unknown>;
};

export class FormTemplateRepository {
  private supabase = createSupabaseServerClient();

  async list(): Promise<FormTemplate[]> {
    const { data, error } = await this.supabase
      .from("form_templates")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToEntity);
  }

  async getById(id: string): Promise<FormTemplate | null> {
    const { data, error } = await this.supabase
      .from("form_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return rowToEntity(data);
  }

  async create(input: CreateTemplateInput): Promise<FormTemplate> {
    const parsed = parseSchema(input.schema);
    if (!parsed.success) {
      throw new Error(parsed.error.message);
    }

    const { data, error } = await this.supabase
      .from("form_templates")
      .insert({
        slug: input.slug,
        name: input.name,
        description: input.description ?? null,
        schema: formatSchema(parsed.data) as unknown as JSON,
        version: 1,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return rowToEntity(data);
  }

  async update(id: string, input: UpdateTemplateInput): Promise<FormTemplate> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Template not found");

    const updateData: Record<string, unknown> = {};
    let newSchema = existing.schema;

    if (input.schema) {
      const parsed = parseSchema(input.schema);
      if (!parsed.success) {
        throw new Error(parsed.error.message);
      }
      newSchema = parsed.data;
      updateData.schema = formatSchema(parsed.data) as unknown as JSON;
    }

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;

    updateData.version = existing.version + 1;

    const { data, error } = await this.supabase
      .from("form_templates")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return rowToEntity(data);
  }

  async publish(id: string): Promise<FormTemplate> {
    const { data, error } = await this.supabase
      .from("form_templates")
      .update({ is_active: true })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return rowToEntity(data);
  }

  async deprecate(id: string): Promise<FormTemplate> {
    const { data, error } = await this.supabase
      .from("form_templates")
      .update({ deprecated: true, is_active: false })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return rowToEntity(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("form_templates")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  }
}
