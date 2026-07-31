"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ProfileRow } from "@/features/users";

export default function UserDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [user, setUser] = useState<ProfileRow | null>(null);
  const [formCount, setFormCount] = useState<number | null>(null);
  const [aircraftCount, setAircraftCount] = useState<number | null>(null);
  const [aircraft, setAircraft] = useState<any[]>([]);
  const [formActivity, setFormActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [usersRes, instancesRes, aircraftRes, formsRes] = await Promise.all([
          fetch("/api/v1/users"),
          fetch("/api/v1/form-instances"),
          fetch("/api/v1/aircraft"),
          fetch("/api/v1/forms"),
        ]);

        const [usersData, instancesData, aircraftData, formsData] = await Promise.all([
          usersRes.json(), instancesRes.json(),
          aircraftRes.json(), formsRes.json(),
        ]);

        const list: ProfileRow[] = usersData.data ?? [];
        const found = list.find((u: ProfileRow) => u.id === id) ?? null;
        setUser(found);

        const allForms: any[] = instancesData.data ?? [];
        const userForms = allForms.filter((f: any) => f.user_id === id);
        setFormCount(userForms.length);

        const allAircraft: any[] = aircraftData.data ?? [];
        const userAircraft = allAircraft.filter((a: any) => a.user_id === id);
        setAircraftCount(userAircraft.length);
        setAircraft(userAircraft);

        const templateNames = new Map(
          (formsData.data ?? []).map((f: any) => [f.id, f.name])
        );
        setFormActivity(
          userForms
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 10)
            .map((f: any) => ({
              ...f,
              template_name: templateNames.get(f.template_id) || f.template_id.slice(0, 8),
            }))
        );
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-runway-300 border-t-brand-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg font-semibold text-runway-900">User not found</p>
        <Link href="/users" className="mt-2 text-sm text-brand-600 hover:underline">Back to Users</Link>
      </div>
    );
  }

  const daysActive = Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000);

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3 text-sm text-runway-400">
        <Link href="/users" className="hover:text-runway-600 transition-colors">Users</Link>
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
        <span className="font-medium text-runway-900">{user.full_name}</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-runway-200 bg-white">
        <div className="h-24 bg-gradient-to-r from-brand-500 to-brand-700" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex items-end gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-2xl font-bold text-white shadow-lg ring-4 ring-white">
              {user.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div className="pb-1">
              <h1 className="text-xl font-bold text-runway-900">{user.full_name}</h1>
              <div className="mt-1 flex items-center gap-3">
                <span className={`inline-flex rounded-full px-3 py-0.5 text-xs font-semibold ${
                  user.role === "admin" ? "bg-purple-100 text-purple-700 ring-1 ring-purple-200" : "bg-blue-100 text-blue-700 ring-1 ring-blue-200"
                }`}>{user.role}</span>
                <span className="text-xs text-runway-400">ID: {user.id}</span>
                <span className="text-xs text-runway-400">Joined {new Date(user.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-runway-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-runway-900">
            <svg className="h-4 w-4 text-runway-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Forms Submitted
          </div>
          <p className="mt-2 text-3xl font-bold text-runway-900">{formCount ?? "—"}</p>
        </div>
        <div className="rounded-2xl border border-runway-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-runway-900">
            <svg className="h-4 w-4 text-runway-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Aircraft
          </div>
          <p className="mt-2 text-3xl font-bold text-runway-900">{aircraftCount ?? "—"}</p>
        </div>
        <div className="rounded-2xl border border-runway-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-runway-900">
            <svg className="h-4 w-4 text-runway-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Days Active
          </div>
          <p className="mt-2 text-3xl font-bold text-runway-900">{daysActive}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-runway-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-runway-900">Aircraft</h2>
          {aircraft.length === 0 ? (
            <p className="py-8 text-center text-sm text-runway-400">No aircraft assigned.</p>
          ) : (
            <ul className="space-y-2">
              {aircraft.map((a: any) => (
                <li key={a.id} className="flex items-center justify-between rounded-xl bg-runway-50/50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-runway-900">{a.aircraft_id || a.registration || "—"}</p>
                    <p className="text-xs text-runway-400">{a.type || a.model || "Unknown type"}</p>
                  </div>
                  <span className="text-xs text-runway-400">{a.equipment || ""}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-runway-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-runway-900">Recent Form Activity</h2>
          {formActivity.length === 0 ? (
            <p className="py-8 text-center text-sm text-runway-400">No forms submitted yet.</p>
          ) : (
            <ul className="space-y-2">
              {formActivity.map((f: any) => (
                <li key={f.id} className="flex items-center justify-between rounded-xl bg-runway-50/50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-runway-900">{f.template_name}</p>
                    <p className="text-xs text-runway-400">{new Date(f.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    f.status === "completed" ? "bg-green-100 text-green-700" :
                    f.status === "synced" ? "bg-blue-100 text-blue-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>{f.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
