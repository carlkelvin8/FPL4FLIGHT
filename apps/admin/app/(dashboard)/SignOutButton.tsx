"use client";

import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <button
      onClick={() => { void handleSignOut(); }}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-runway-600 transition hover:bg-runway-100 hover:text-runway-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
    >
      Sign Out
    </button>
  );
}
