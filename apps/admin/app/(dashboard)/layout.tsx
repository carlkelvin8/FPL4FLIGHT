import Link from "next/link";
import { createSupabaseServerClient, supabaseConfigured } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "./SignOutButton";
const navItems = [
  { href: "/", label: "Overview" },
  { href: "/forms", label: "Forms" },
  { href: "/users", label: "Users" },
  { href: "/subscriptions", label: "Subscriptions" },
  { href: "/audit", label: "Audit Log" },
] as const;

type SessionUser = { email: string; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> };
type SessionProfile = { role: string; full_name: string | null };

async function getSession(): Promise<{ user: SessionUser | null; profile: SessionProfile | null } | null> {
  if (!supabaseConfigured()) return null;

  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { user: null, profile: null };

    const metadataRole = user.app_metadata?.role as string | undefined;
    if (metadataRole === "admin") {
      return {
        user: { email: user.email ?? "", app_metadata: user.app_metadata, user_metadata: user.user_metadata },
        profile: { role: "admin", full_name: (user.user_metadata?.full_name as string) ?? null },
      };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .maybeSingle();

    return {
      user: { email: user.email ?? "", app_metadata: user.app_metadata, user_metadata: user.user_metadata },
      profile,
    };
  } catch {
    return { user: null, profile: null };
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

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

  if (!session.user) {
    redirect("/login");
  }

  const isAdmin = session.profile?.role === "admin";
  if (!isAdmin) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside
        className="flex w-64 shrink-0 flex-col bg-runway-800"
        aria-label="Sidebar navigation"
      >
        <div className="flex h-16 items-center border-b border-runway-700 px-6">
          <span className="text-lg font-semibold tracking-tight text-white">
            PilotForms™
          </span>
        </div>

        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-1" role="list">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-runway-200 transition-colors hover:bg-runway-700 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-runway-200 bg-white px-6">
          <span className="text-sm text-runway-700">
            {session.profile?.full_name ?? session.user.email}
          </span>
          <SignOutButton />
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
