import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ProfileRow {
  id: string;
  full_name: string;
  role: "pilot" | "admin";
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateUserInput = {
  email: string;
  password: string;
  full_name: string;
  role: "pilot" | "admin";
};

export type UpdateUserInput = {
  full_name?: string;
  role?: "pilot" | "admin";
  avatar_url?: string | null;
};

export class UserRepository {
  private supabase = createSupabaseServerClient();

  async list(): Promise<ProfileRow[]> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async getById(id: string): Promise<ProfileRow | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return data;
  }

  async update(id: string, input: UpdateUserInput): Promise<ProfileRow> {
    const { data, error } = await this.supabase
      .from("profiles")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("profiles")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  }
}
