import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AuditEvent {
  id: number;
  user_id: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface DashboardCounts {
  users: number;
  aircraft: number;
  formTemplates: number;
  formInstances: number;
  subscriptions: number;
  auditEvents: number;
}

export class AnalyticsRepository {
  private supabase = createSupabaseServerClient();

  async getCounts(): Promise<DashboardCounts> {
    const [users, aircraft, formTemplates, formInstances, subscriptions, auditEvents] =
      await Promise.all([
        this.count("profiles"),
        this.count("aircraft"),
        this.count("form_templates"),
        this.count("form_instances"),
        this.count("subscriptions"),
        this.count("audit_logs"),
      ]);

    return { users, aircraft, formTemplates, formInstances, subscriptions, auditEvents };
  }

  async getRecentAudit(limit = 8): Promise<AuditEvent[]> {
    const { data, error } = await this.supabase
      .from("audit_logs")
      .select("id, user_id, action, resource, resource_id, ip_address, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return (data ?? []) as AuditEvent[];
  }

  private async count(table: string): Promise<number> {
    const { count, error } = await this.supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (error) throw new Error(error.message);
    return count ?? 0;
  }
}
