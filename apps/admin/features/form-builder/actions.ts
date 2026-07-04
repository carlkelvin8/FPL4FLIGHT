"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { FormTemplateRepository, type CreateTemplateInput, type UpdateTemplateInput } from "./repository";

const repo = new FormTemplateRepository();

const CreateSchema = z.object({
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  schema: z.record(z.unknown()),
});

const UpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  schema: z.record(z.unknown()).optional(),
});

export type ActionState = {
  error: string | null;
  success: boolean;
};

export async function createTemplate(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let rawSchema: Record<string, unknown>;
  try {
    rawSchema = JSON.parse(formData.get("schema") as string);
  } catch {
    return { error: "Invalid JSON in schema field.", success: false };
  }

  const parsed = CreateSchema.safeParse({
    slug: formData.get("slug"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    schema: rawSchema,
  });

  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { error: first?.message ?? "Invalid input", success: false };
  }

  try {
    await repo.create(parsed.data as CreateTemplateInput);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create template.", success: false };
  }

  revalidatePath("/forms");
  return { error: null, success: true };
}

export async function updateTemplate(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let rawSchema: Record<string, unknown> | undefined;
  const schemaRaw = formData.get("schema");
  if (schemaRaw) {
    try {
      rawSchema = JSON.parse(schemaRaw as string);
    } catch {
      return { error: "Invalid JSON in schema field.", success: false };
    }
  }

  const parsed = UpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name") || undefined,
    description: formData.get("description") || undefined,
    schema: rawSchema,
  });

  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { error: first?.message ?? "Invalid input", success: false };
  }

  try {
    await repo.update(parsed.data.id, parsed.data as UpdateTemplateInput);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update template.", success: false };
  }

  revalidatePath("/forms");
  return { error: null, success: true };
}

export async function publishTemplate(id: string): Promise<ActionState> {
  try {
    await repo.publish(id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to publish template.", success: false };
  }

  revalidatePath("/forms");
  return { error: null, success: true };
}

export async function deprecateTemplate(id: string): Promise<ActionState> {
  try {
    await repo.deprecate(id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to deprecate template.", success: false };
  }

  revalidatePath("/forms");
  return { error: null, success: true };
}

export async function deleteTemplate(id: string): Promise<ActionState> {
  try {
    await repo.delete(id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete template.", success: false };
  }

  revalidatePath("/forms");
  return { error: null, success: true };
}
