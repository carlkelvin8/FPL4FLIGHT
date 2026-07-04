import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../core/network";
import { useAuthStore } from "../../auth/stores/authStore";

export interface Profile {
  id: string;
  fullName: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ProfileRow {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

const PROFILE_KEY = ["profile"];

export function useProfile() {
  const userId = useAuthStore((s) => s.user?.id);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...PROFILE_KEY, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw new Error(error.message);
      const row = data as ProfileRow;
      return {
        id: row.id,
        fullName: row.full_name,
        role: row.role,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      } as Profile;
    },
    enabled: !!userId,
  });

  const client = supabase;

  return {
    profile: data ?? null,
    isLoading: isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
