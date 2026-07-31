import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AuditLogRow {
  id: number;
  user_id: string | null;
  user_name: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  old_value: unknown;
  new_value: unknown;
  ip_address: string | null;
  created_at: string;
}

export class AuditRepository {
  private supabase = createSupabaseServerClient();

  async list(): Promise<AuditLogRow[]> {
    const { data, error } = await this.supabase
      .from("audit_logs")
      .select("*, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);

    return (data ?? []).map((row) => ({
      id: row.id,
      user_id: row.user_id,
      user_name: row.profiles?.full_name ?? null,
      action: row.action,
      resource: row.resource,
      resource_id: row.resource_id,
      old_value: row.old_value,
      new_value: row.new_value,
      ip_address: row.ip_address,
      created_at: row.created_at,
    }));
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("audit_logs").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}
