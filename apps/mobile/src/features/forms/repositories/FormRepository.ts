import type { IFormRepository } from "@pilotforms/shared";
import type { Result, FormInstance, CreateFormDto, UpdateFormDto, FormFilters, PaginatedResult } from "@pilotforms/shared";
import { ok, err } from "@pilotforms/shared";
import { supabase } from "../../../core/network";

interface FormInstanceRow {
  id: string;
  user_id: string;
  template_id: string;
  template_version: number;
  status: string;
  data: Record<string, unknown>;
  device_id: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  template_name?: string;
}

function rowToInstance(row: FormInstanceRow): FormInstance {
  return {
    id: row.id,
    userId: row.user_id,
    templateId: row.template_id,
    templateVersion: row.template_version,
    status: row.status as "draft" | "completed" | "synced",
    data: row.data as FormInstance["data"],
    submittedAt: row.submitted_at ? new Date(row.submitted_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class FormRepository implements IFormRepository {
  async create(dto: CreateFormDto): Promise<Result<FormInstance>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return err("UNAUTHORIZED", "You must be signed in to create forms.");

      const { data, error } = await supabase
        .from("form_instances")
        .insert({
          user_id: user.id,
          template_id: dto.templateId,
          template_version: dto.templateVersion,
          data: dto.data ?? {},
        })
        .select()
        .single();

      if (error) return err("DB_ERROR", error.message, error);
      return ok(rowToInstance(data));
    } catch (e) {
      return err("NETWORK_ERROR", "Network error creating form.", e);
    }
  }

  async findById(id: string): Promise<Result<FormInstance>> {
    try {
      const { data, error } = await supabase
        .from("form_instances")
        .select("*")
        .eq("id", id)
        .single();

      if (error) return err("NOT_FOUND", error.message, error);
      return ok(rowToInstance(data));
    } catch (e) {
      return err("NETWORK_ERROR", "Network error fetching form.", e);
    }
  }

  async findByUser(userId: string, filters: FormFilters): Promise<Result<PaginatedResult<FormInstance>>> {
    try {
      let query = supabase
        .from("form_instances")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (filters.status && filters.status.length > 0) {
        query = query.in("status", filters.status);
      }
      if (filters.templateId) {
        query = query.eq("template_id", filters.templateId);
      }
      if (filters.search) {
        query = query.textSearch("data", filters.search);
      }

      const { data, error, count } = await query;

      if (error) return err("DB_ERROR", error.message, error);

      const items = (data ?? []).map(rowToInstance);
      return ok({
        items,
        total: count ?? items.length,
        page: 1,
        pageSize: 50,
      });
    } catch (e) {
      return err("NETWORK_ERROR", "Network error fetching forms.", e);
    }
  }

  async update(id: string, dto: UpdateFormDto): Promise<Result<FormInstance>> {
    try {
      const payload: Record<string, unknown> = {};
      if (dto.status) payload.status = dto.status;
      if (dto.data) payload.data = dto.data;
      if (dto.submittedAt !== undefined) payload.submitted_at = dto.submittedAt?.toISOString() ?? null;

      const { data, error } = await supabase
        .from("form_instances")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) return err("DB_ERROR", error.message, error);
      return ok(rowToInstance(data));
    } catch (e) {
      return err("NETWORK_ERROR", "Network error updating form.", e);
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from("form_instances")
        .delete()
        .eq("id", id);

      if (error) return err("DB_ERROR", error.message, error);
      return ok(undefined);
    } catch (e) {
      return err("NETWORK_ERROR", "Network error deleting form.", e);
    }
  }

  async findPendingSync(): Promise<Result<FormInstance[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return err("UNAUTHORIZED", "Not authenticated.");

      const { data, error } = await supabase
        .from("form_instances")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["draft", "completed"])
        .order("updated_at", { ascending: false });

      if (error) return err("DB_ERROR", error.message, error);
      return ok((data ?? []).map(rowToInstance));
    } catch (e) {
      return err("NETWORK_ERROR", "Network error fetching pending sync.", e);
    }
  }
}

export const formRepository = new FormRepository();
