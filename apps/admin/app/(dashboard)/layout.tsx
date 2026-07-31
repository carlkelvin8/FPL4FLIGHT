import { cookies } from "next/headers";
import { Sidebar } from "./sidebar";
import { SignOutButton } from "./SignOutButton";

interface AdminSession {
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
}

async function getSupabaseSession(): Promise<AdminSession | null> {
  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const metadataRole = user.app_metadata?.role as string | undefined;
    if (metadataRole === "admin") {
      return {
        email: user.email ?? "",
        full_name: (user.user_metadata?.full_name as string) ?? user.email ?? "",
        avatar_url: null,
        role: "admin",
      };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") return null;

    return {
      email: user.email ?? "",
      full_name: profile?.full_name ?? user.email ?? "",
      avatar_url: profile?.avatar_url ?? null,
      role: "admin",
    };
  } catch {
    return null;
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSupabaseSession();

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-runway-50">
        <p className="text-sm text-runway-500">
          Supabase not configured. Set up <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code className="font-mono text-xs">.env.local</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-runway-50">
      <Sidebar userName={session.full_name} userEmail={session.email} avatarUrl={session.avatar_url} />

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-runway-200 bg-white px-6">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-runway-200">
              {session.avatar_url ? (
                <img src={session.avatar_url} alt={session.full_name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white shadow-sm">
                  {(session.full_name ?? session.email).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-runway-900">{session.full_name}</p>
              <p className="text-xs text-runway-400">{session.email}</p>
            </div>
          </div>
          <SignOutButton />
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
