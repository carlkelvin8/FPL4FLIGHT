import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SubscriptionRow {
  id: string;
  user_id: string;
  status: string;
  plan: string;
  trial_ends_at: string | null;
  current_period_end: string;
  created_at: string;
  profiles?: { full_name: string } | null;
}

export interface SubscriptionSummary {
  [status: string]: number;
}

export class SubscriptionsRepository {
  private supabase = createSupabaseServerClient();

  async list(limit = 100): Promise<SubscriptionRow[]> {
    const { data, error } = await this.supabase
      .from("subscriptions")
      .select("id, user_id, status, plan, trial_ends_at, current_period_end, created_at, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as SubscriptionRow[];
  }

  async summary(): Promise<SubscriptionSummary> {
    const { data, error } = await this.supabase
      .from("subscriptions")
      .select("status");

    if (error) throw new Error(error.message);

    const summary: SubscriptionSummary = {};
    for (const row of data ?? []) {
      const key = (row as { status: string }).status;
      summary[key] = (summary[key] ?? 0) + 1;
    }
    return summary;
  }
}
