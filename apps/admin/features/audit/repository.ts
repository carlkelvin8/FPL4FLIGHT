import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AuditLogRow {
  id: number;
  user_id: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  ip_address: string | null;
  created_at: string;
}

export class AuditLogRepository {
  private supabase = createSupabaseServerClient();

  async list(limit = 100): Promise<AuditLogRow[]> {
    const { data, error } = await this.supabase
      .from("audit_logs")
      .select("id, user_id, action, resource, resource_id, ip_address, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return (data ?? []) as AuditLogRow[];
  }
}
