import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SubscriptionRow {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  status: "trialing" | "active" | "past_due" | "canceled" | "expired";
  plan: "monthly" | "annual";
  trial_ends_at: string | null;
  current_period_end: string;
  external_id: string | null;
  created_at: string;
  updated_at: string;
}

export type UpdateSubscriptionInput = {
  status?: "trialing" | "active" | "past_due" | "canceled" | "expired";
  plan?: "monthly" | "annual";
  current_period_end?: string;
};

export class SubscriptionRepository {
  private supabase = createSupabaseServerClient();

  async list(): Promise<SubscriptionRow[]> {
    const { data, error } = await this.supabase
      .from("subscriptions")
      .select("*, profiles(full_name)")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? []).map((row) => ({
      id: row.id,
      user_id: row.user_id,
      user_name: row.profiles?.full_name ?? undefined,
      status: row.status,
      plan: row.plan,
      trial_ends_at: row.trial_ends_at,
      current_period_end: row.current_period_end,
      external_id: row.external_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  async getById(id: string): Promise<SubscriptionRow | null> {
    const { data, error } = await this.supabase
      .from("subscriptions")
      .select("*, profiles(full_name)")
      .eq("id", id)
      .single();

    if (error) return null;

    return {
      id: data.id,
      user_id: data.user_id,
      user_name: data.profiles?.full_name ?? undefined,
      status: data.status,
      plan: data.plan,
      trial_ends_at: data.trial_ends_at,
      current_period_end: data.current_period_end,
      external_id: data.external_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  async update(id: string, input: UpdateSubscriptionInput): Promise<SubscriptionRow> {
    const { data, error } = await this.supabase
      .from("subscriptions")
      .update(input)
      .eq("id", id)
      .select("*, profiles(full_name)")
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      user_id: data.user_id,
      user_name: data.profiles?.full_name ?? undefined,
      status: data.status,
      plan: data.plan,
      trial_ends_at: data.trial_ends_at,
      current_period_end: data.current_period_end,
      external_id: data.external_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("subscriptions")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  }
}
