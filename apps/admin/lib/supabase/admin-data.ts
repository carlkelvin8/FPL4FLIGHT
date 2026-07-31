import { createSupabaseServiceClient } from "./server";

export const tables = [
  "aircraft", "flights", "form_instances", "payments",
  "chat_channels", "community_messages", "organizations",
  "pilot_logbook", "pilot_profiles", "notifications", "user_preferences",
] as const;

export type TableName = (typeof tables)[number];

export async function getList(table: TableName, select = "*", order?: string) {
  const supabase = createSupabaseServiceClient();
  let q = supabase.from(table).select(select);
  if (order) q = q.order(order, { ascending: false });
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getById(table: TableName, id: string, select = "*") {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.from(table).select(select).eq("id", id).single();
  if (error) return null;
  return data;
}

export async function removeRow(table: TableName, id: string) {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateRow(table: TableName, id: string, data: Record<string, unknown>) {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from(table).update(data).eq("id", id);
  if (error) throw new Error(error.message);
}
