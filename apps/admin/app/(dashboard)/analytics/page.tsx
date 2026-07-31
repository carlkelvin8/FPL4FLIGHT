"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface Stats {
  totalSubmissions: number;
  totalUsers: number;
  totalPilots: number;
  totalForms: number;
  activeTemplates: number;
  totalAircraft: number;
  totalFlights: number;
}

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-runway-200/60 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
      <p className="mb-1 text-xs font-medium text-runway-500">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color || p.fill }}>
          {p.name || p.dataKey}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [submissionsByTemplate, setSubmissionsByTemplate] = useState<{ name: string; count: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [usersRes, formsRes, subsRes, instancesRes, aircraftRes, flightsRes] = await Promise.all([
          fetch("/api/v1/users"), fetch("/api/v1/forms"),
          fetch("/api/v1/subscriptions"), fetch("/api/v1/form-instances"),
          fetch("/api/v1/aircraft"), fetch("/api/v1/flights"),
        ]);

        const [users, forms, subs, instances, aircraft, flights] = await Promise.all([
          usersRes.json(), formsRes.json(), subsRes.json(),
          instancesRes.json(), aircraftRes.json(), flightsRes.json(),
        ]);

        const userList: any[] = users.data ?? [];
        const formList: any[] = forms.data ?? [];
        const subList: any[] = subs.data ?? [];
        const instanceList: any[] = instances.data ?? [];
        const aircraftList: any[] = aircraft.data ?? [];
        const flightList: any[] = flights.data ?? [];

        setStats({
          totalSubmissions: instanceList.length,
          totalUsers: userList.length,
          totalPilots: userList.filter((u: any) => u.role === "pilot").length,
          totalForms: formList.length,
          activeTemplates: formList.filter((f: any) => f.isActive).length,
          totalAircraft: aircraftList.length,
          totalFlights: flightList.length,
        });

        const templateMap = new Map<string, number>();
        const templateNames = new Map<string, string>();
        for (const f of formList) {
          templateNames.set(f.id, f.name);
        }
        for (const inst of instanceList) {
          const tid = inst.template_id;
          templateMap.set(tid, (templateMap.get(tid) || 0) + 1);
        }
        const sorted = [...templateMap.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8);
        setSubmissionsByTemplate(
          sorted.map(([id, count], i) => ({
            name: templateNames.get(id) || id.slice(0, 8),
            count,
            color: COLORS[i % COLORS.length]!,
          }))
        );
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-runway-300 border-t-brand-500" />
    </div>
  );

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-runway-900">Analytics</h1>
        <p className="mt-1 text-sm text-runway-500">Real-time platform analytics from Supabase.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-runway-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-runway-400">Submissions</p>
          <p className="mt-2 text-3xl font-bold text-runway-900">{stats?.totalSubmissions.toLocaleString() || "0"}</p>
        </div>
        <div className="rounded-2xl border border-runway-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-runway-400">Users</p>
          <p className="mt-2 text-3xl font-bold text-runway-900">{stats?.totalUsers.toLocaleString() || "0"}</p>
          <p className="mt-1 text-xs text-runway-400">{stats?.totalPilots} pilots</p>
        </div>
        <div className="rounded-2xl border border-runway-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-runway-400">Form Templates</p>
          <p className="mt-2 text-3xl font-bold text-runway-900">{stats?.totalForms.toLocaleString() || "0"}</p>
          <p className="mt-1 text-xs text-runway-400">{stats?.activeTemplates} active</p>
        </div>
        <div className="rounded-2xl border border-runway-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-runway-400">Aircraft</p>
          <p className="mt-2 text-3xl font-bold text-runway-900">{stats?.totalAircraft.toLocaleString() || "0"}</p>
          <p className="mt-1 text-xs text-runway-400">{stats?.totalFlights} flights</p>
        </div>
      </div>

      <div className="rounded-2xl border border-runway-200 bg-white p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-runway-900">Submissions by Template</h2>
            <p className="mt-0.5 text-xs text-runway-400">Real distribution from form_instances</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={submissionsByTemplate} margin={{ top: 8, right: 8, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} interval={0} angle={-15} textAnchor="end" height={60} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={800}>
              {submissionsByTemplate.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
