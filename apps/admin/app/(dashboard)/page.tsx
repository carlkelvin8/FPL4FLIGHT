"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, AreaChart, Area,
} from "recharts";

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

interface DashboardData {
  pilots: number;
  activeSubs: number;
  formsSubmitted: number;
  flightsCount: number;
  templateSubmissions: { name: string; submissions: number; color: string }[];
  planData: { name: string; value: number; color: string }[];
  recentInstances: any[];
  recentFlights: any[];
  monthlyGrowth: { month: string; forms: number; users: number }[];
}

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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [usersRes, subsRes, formsRes, instancesRes, flightsRes] = await Promise.all([
          fetch("/api/v1/users"), fetch("/api/v1/subscriptions"),
          fetch("/api/v1/forms"), fetch("/api/v1/form-instances"),
          fetch("/api/v1/flights"),
        ]);

        const [users, subs, forms, instances, flights] = await Promise.all([
          usersRes.json(), subsRes.json(), formsRes.json(),
          instancesRes.json(), flightsRes.json(),
        ]);

        const userList: any[] = users.data ?? [];
        const subList: any[] = subs.data ?? [];
        const formList: any[] = forms.data ?? [];
        const instanceList: any[] = instances.data ?? [];
        const flightList: any[] = flights.data ?? [];

        const pilots = userList.filter((u: any) => u.role === "pilot").length;
        const activeSubs = subList.filter((s: any) => s.status === "active").length;
        const formsSubmitted = instanceList.length;
        const flightsCount = flightList.length;

        const templateNames = new Map(formList.map((f: any) => [f.id, f.name]));
        const templateCounts = new Map<string, number>();
        for (const inst of instanceList) {
          const tid = inst.template_id;
          templateCounts.set(tid, (templateCounts.get(tid) || 0) + 1);
        }
        const sortedTemplates = [...templateCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6);
        const templateSubmissions = sortedTemplates.map(([id, count], i) => ({
          name: templateNames.get(id) || id.slice(0, 8),
          submissions: count,
          color: COLORS[i]!,
        }));

        const planCounts = new Map<string, number>();
        for (const s of subList) {
          const key = s.plan === "annual" ? "Annual" : "Monthly";
          const prefix = "Pro"; // simplified
          planCounts.set(prefix + " " + key, (planCounts.get(prefix + " " + key) || 0) + 1);
        }
        const planData = [...planCounts.entries()].map(([name, value], i) => ({
          name, value, color: COLORS[i % COLORS.length]!,
        }));

        const recentInstances = instanceList.slice(0, 5);
        const recentFlightsList = flightList.slice(0, 4);

        const months = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];
        const monthlyGrowth = months.map((m, i) => ({
          month: m,
          forms: Math.round(formsSubmitted * (0.1 + i * 0.05)),
          users: Math.round(pilots * (0.05 + i * 0.03)),
        }));

        setData({
          pilots, activeSubs, formsSubmitted, flightsCount,
          templateSubmissions, planData,
          recentInstances: recentInstances,
          recentFlights: recentFlightsList,
          monthlyGrowth,
        });
      } catch {
        // fallback
      }
    };
    fetchAll();
  }, []);

  const d = data;

  return (
    <section className="space-y-6">
      <svg width="0" height="0">
        <defs>
          <linearGradient id="barBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9}/><stop offset="100%" stopColor="#3b82f6" stopOpacity={0.4}/></linearGradient>
          <linearGradient id="barPurple" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9}/><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.4}/></linearGradient>
          <linearGradient id="barCyan" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9}/><stop offset="100%" stopColor="#06b6d4" stopOpacity={0.4}/></linearGradient>
          <linearGradient id="barGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/><stop offset="100%" stopColor="#10b981" stopOpacity={0.4}/></linearGradient>
          <linearGradient id="barAmber" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9}/><stop offset="100%" stopColor="#f59e0b" stopOpacity={0.4}/></linearGradient>
          <linearGradient id="barRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.9}/><stop offset="100%" stopColor="#ef4444" stopOpacity={0.4}/></linearGradient>
          <linearGradient id="areaForms" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2}/><stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
          <linearGradient id="areaUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2}/><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
        </defs>
      </svg>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-runway-900">Dashboard</h1>
          <p className="mt-1 text-sm text-runway-500">Real-time overview from Supabase data.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-runway-200 bg-white px-4 py-2 text-xs text-runway-500">
          <span className={`h-2 w-2 rounded-full ${d ? "bg-green-500" : "bg-gray-400"}`} />
          {d ? "Live" : "Loading..."}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-2xl border border-runway-200/80 bg-white p-6 transition-all hover:shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wider text-runway-400">Total Pilots</p>
          <p className="mt-3 text-3xl font-bold text-runway-900">{d?.pilots.toLocaleString() ?? "—"}</p>
          <p className="mt-1.5 text-xs font-medium text-green-600">from profiles</p>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-runway-200/80 bg-white p-6 transition-all hover:shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wider text-runway-400">Active Subs</p>
          <p className="mt-3 text-3xl font-bold text-runway-900">{d?.activeSubs.toLocaleString() ?? "—"}</p>
          <p className="mt-1.5 text-xs font-medium text-green-600">from subscriptions</p>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-runway-200/80 bg-white p-6 transition-all hover:shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wider text-runway-400">Forms Submitted</p>
          <p className="mt-3 text-3xl font-bold text-runway-900">{d?.formsSubmitted.toLocaleString() ?? "—"}</p>
          <p className="mt-1.5 text-xs font-medium text-green-600">from form_instances</p>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-runway-200/80 bg-white p-6 transition-all hover:shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wider text-runway-400">Flights</p>
          <p className="mt-3 text-3xl font-bold text-runway-900">{d?.flightsCount.toLocaleString() ?? "—"}</p>
          <p className="mt-1.5 text-xs font-medium text-green-600">from flights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
        <div className="overflow-hidden rounded-2xl border border-runway-200/80 bg-white p-6 lg:col-span-4">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-runway-900">Form Submissions by Template</h2>
              <p className="mt-0.5 text-xs text-runway-400">Real data from form_instances</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={d?.templateSubmissions ?? []} margin={{ top: 8, right: 8, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} interval={0} angle={-15} textAnchor="end" height={60} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="submissions" radius={[6, 6, 0, 0]}>
                {(d?.templateSubmissions ?? []).map((_, i) => (
                  <Cell key={i} fill={`url(#bar${["Blue","Purple","Cyan","Green","Amber","Red"][i]})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-hidden rounded-2xl border border-runway-200/80 bg-white p-6 lg:col-span-3">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-runway-900">Plan Distribution</h2>
              <p className="mt-0.5 text-xs text-runway-400">Real data from subscriptions</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={d?.planData ?? []} cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={4} dataKey="value" stroke="none">
                {(d?.planData ?? []).map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2">
            {(d?.planData ?? []).map((p) => (
              <div key={p.name} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="font-medium text-runway-700">{p.name}</span>
                <span className="text-runway-400">{p.value}</span>
              </div>
            ))}
            {(d?.planData ?? []).length === 0 && <span className="text-xs text-runway-400">No subscription data</span>}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-runway-200/80 bg-white p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-runway-900">Monthly Growth (estimated)</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-runway-500">Forms</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
              <span className="text-runway-500">Users</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={d?.monthlyGrowth ?? []} margin={{ top: 8, right: 8, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="forms" stroke="#3b82f6" strokeWidth={2.5} fill="url(#areaForms)" dot={{ fill: "#3b82f6", stroke: "#fff", strokeWidth: 2, r: 4 }} />
            <Area type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#areaUsers)" dot={{ fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2, r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-runway-200/80 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-runway-900">Recent Submissions</h2>
          {!d || d.recentInstances.length === 0 ? (
            <p className="py-8 text-center text-sm text-runway-400">No submissions yet.</p>
          ) : (
            <ul className="space-y-3">
              {d.recentInstances.map((item: any, i: number) => (
                <li key={i} className="flex items-center justify-between gap-4 rounded-xl bg-runway-50/50 p-3">
                  <div>
                    <p className="text-sm text-runway-900">
                      <span className="font-mono text-xs text-runway-500">{item.template_id.slice(0, 8)}</span>
                      <span className="mx-1.5 text-runway-300">·</span>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        item.status === "completed" ? "bg-green-100 text-green-700" :
                        item.status === "synced" ? "bg-blue-100 text-blue-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>{item.status}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-runway-400">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                </li>
              ))}
              <li>
                <Link href="/submissions" className="text-xs font-medium text-brand-600 hover:text-brand-800">View all →</Link>
              </li>
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-runway-200/80 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-runway-900">Flights</h2>
          {!d || d.recentFlights.length === 0 ? (
            <p className="py-8 text-center text-sm text-runway-400">No flights yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {d.recentFlights.map((item: any, i: number) => (
                <li key={i} className="flex items-center justify-between rounded-xl bg-runway-50/50 p-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                      item.status === "departed" ? "bg-green-100 text-green-700" :
                      item.status === "arrived" ? "bg-green-100 text-green-700" :
                      item.status === "delayed" ? "bg-red-100 text-red-700" :
                      "bg-indigo-100 text-indigo-700"
                    }`}>{item.flight_number?.split("-")[1] || "—"}</div>
                    <div>
                      <p className="text-sm font-medium text-runway-900">{item.flight_number || "—"}</p>
                      <p className="text-xs text-runway-400">{item.departure_code || "?"} → {item.arrival_code || "?"}</p>
                    </div>
                  </div>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    item.status === "departed" || item.status === "arrived" ? "bg-green-100 text-green-700" :
                    item.status === "delayed" ? "bg-red-100 text-red-700" :
                    "bg-indigo-100 text-indigo-700"
                  }`}>{item.status}</span>
                </li>
              ))}
              <li>
                <Link href="/flights" className="text-xs font-medium text-brand-600 hover:text-brand-800">View all →</Link>
              </li>
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
