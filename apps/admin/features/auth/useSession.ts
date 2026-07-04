"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface AdminSession {
  user: User;
  role: "admin";
}

export function useSession() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setLoading(false);
        return;
      }
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile?.role === "admin") {
            setSession({ user, role: "admin" });
          }
          setLoading(false);
        });
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, supabaseSession) => {
        if (!supabaseSession) {
          setSession(null);
        }
      },
    );

    return () => listener?.subscription.unsubscribe();
  }, []);

  return { session, loading };
}
