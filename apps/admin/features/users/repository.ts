import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ProfileRow {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
}

export class UsersRepository {
  private supabase = createSupabaseServerClient();

  async list(limit = 100): Promise<ProfileRow[]> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("id, full_name, role, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return (data ?? []) as ProfileRow[];
  }
}
