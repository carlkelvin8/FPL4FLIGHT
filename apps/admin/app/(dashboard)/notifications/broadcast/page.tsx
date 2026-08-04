"use client";

import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/lib/components/toast";
import { ErrorState } from "@/lib/components/error-state";

interface AudienceUser {
  user_id: string;
  full_name: string | null;
  platform: string | null;
  updated_at: string | null;
}

interface BroadcastResult {
  targeted: number;
  pushTargeted: number;
  pushSent: number;
  appNotifications: number;
  pushResult?: { error?: string } | null;
}

const inputClass =
  "w-full rounded-lg border border-runway-300 bg-white px-3 py-2 text-sm text-runway-900 placeholder-runway-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";
const labelClass = "mb-1.5 block text-sm font-medium text-runway-700";

export default function PushBroadcastPage() {
  const { toast } = useToast();
  const [audience, setAudience] = useState<AudienceUser[]>([]);
  const [tokenCount, setTokenCount] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<"all" | "selected">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [type, setType] = useState("broadcast");
  const [channel, setChannel] = useState("default");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/push-broadcast");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setAudience(json.data ?? []);
      setTokenCount(json.tokenCount ?? 0);
      setTotalUsers(json.totalUsers ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load broadcast data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredAudience = useMemo(() => {
    if (!search) return audience;
    const q = search.toLowerCase();
    return audience.filter((u) =>
      (u.full_name || "").toLowerCase().includes(q) ||
      (u.platform || "").toLowerCase().includes(q)
    );
  }, [audience, search]);

  const selectedCount = mode === "all" ? totalUsers : selected.size;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    setConfirming(false);
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/v1/push-broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          type: type.trim(),
          target: mode,
          userIds: mode === "selected" ? [...selected] : undefined,
          channelId: channel,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error ?? "Broadcast failed", "error");
        return;
      }
      setResult(json.data as BroadcastResult);
      toast("Broadcast sent");
      setTitle("");
      setBody("");
      setSelected(new Set());
    } catch {
      toast("Failed to send broadcast", "error");
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-runway-300 border-t-brand-500" />
    </div>
  );

  if (error) return (
    <section className="space-y-6">
      <div><h1 className="text-2xl font-semibold text-runway-900">Push Broadcast</h1><p className="mt-1 text-sm text-runway-500">Compose and send push notifications to users.</p></div>
      <ErrorState message={error} onRetry={fetchData} />
    </section>
  );

  const canSend = title.trim().length > 0 && body.trim().length > 0 && selectedCount > 0;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-runway-900">Push Broadcast</h1>
        <p className="mt-1 text-sm text-runway-500">Send a push notification and in-app alert to pilots.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Total Users</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{totalUsers}</p>
        </div>
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Devices Registered</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{tokenCount}</p>
        </div>
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Audience</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{selectedCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-5 rounded-xl border border-runway-200 bg-white p-6 lg:col-span-2">
          <div>
            <span className={labelClass}>Audience</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("all")}
                className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${mode === "all" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-runway-300 text-runway-600 hover:bg-runway-50"}`}
              >
                All users ({totalUsers})
              </button>
              <button
                onClick={() => setMode("selected")}
                className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${mode === "selected" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-runway-300 text-runway-600 hover:bg-runway-50"}`}
              >
                Specific users ({selected.size})
              </button>
            </div>
          </div>

          {mode === "selected" && (
            <div className="rounded-lg border border-runway-200">
              <div className="border-b border-runway-200 p-3">
                <input type="text" placeholder="Search registered users..." value={search} onChange={(e) => setSearch(e.target.value)} className={inputClass} />
              </div>
              <div className="max-h-56 overflow-y-auto">
                {filteredAudience.length === 0 && (
                  <p className="px-4 py-8 text-center text-sm text-runway-400">No users with registered devices.</p>
                )}
                {filteredAudience.map((u) => (
                  <label key={u.user_id} className="flex cursor-pointer items-center gap-3 border-b border-runway-100 px-4 py-2.5 text-sm transition-colors last:border-0 hover:bg-runway-50">
                    <input type="checkbox" checked={selected.has(u.user_id)} onChange={() => toggleSelect(u.user_id)} className="rounded border-runway-300 text-brand-600 focus:ring-brand-500" />
                    <span className="flex-1 font-medium text-runway-900">{u.full_name || "Unnamed pilot"}</span>
                    <span className="text-xs uppercase text-runway-400">{u.platform || "unknown"}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="broadcast-type">Type</label>
              <select id="broadcast-type" value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
                <option value="broadcast">Broadcast</option>
                <option value="system">System</option>
                <option value="flight">Flight Alert</option>
                <option value="community">Community</option>
                <option value="update">App Update</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="broadcast-channel">Android Channel</label>
              <select id="broadcast-channel" value={channel} onChange={(e) => setChannel(e.target.value)} className={inputClass}>
                <option value="default">Default</option>
                <option value="chat">Chat Messages</option>
                <option value="flights">Flight Alerts</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="broadcast-title">Title <span className="text-runway-400">({title.length}/200)</span></label>
            <input
              id="broadcast-title"
              type="text"
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Flight Operations Notice"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="broadcast-body">Message <span className="text-runway-400">({body.length}/2000)</span></label>
            <textarea
              id="broadcast-body"
              value={body}
              maxLength={2000}
              rows={5}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write the notification message..."
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="flex items-center justify-between border-t border-runway-100 pt-5">
            <p className="text-xs text-runway-400">Delivered as push + in-app to {selectedCount} {selectedCount === 1 ? "pilot" : "pilots"}.</p>
            <button
              onClick={() => setConfirming(true)}
              disabled={!canSend || sending}
              className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send Broadcast"}
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-runway-200 bg-white p-6">
            <p className="mb-4 text-sm font-semibold text-runway-900">Preview</p>
            <div className="rounded-xl border border-runway-100 bg-runway-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-runway-900">{title || "Notification title"}</p>
                  <p className="mt-0.5 text-sm text-runway-600">{body || "Your notification message will appear here."}</p>
                  <p className="mt-2 text-[10px] font-medium uppercase tracking-wider text-runway-400">{type}</p>
                </div>
              </div>
            </div>
          </div>

          {result && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-6">
              <p className="mb-3 text-sm font-semibold text-green-800">Broadcast Results</p>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-green-700">Targeted</dt><dd className="font-semibold text-green-900">{result.targeted}</dd></div>
                <div className="flex justify-between"><dt className="text-green-700">Push targeted</dt><dd className="font-semibold text-green-900">{result.pushTargeted}</dd></div>
                <div className="flex justify-between"><dt className="text-green-700">Push sent</dt><dd className="font-semibold text-green-900">{result.pushSent}</dd></div>
                <div className="flex justify-between"><dt className="text-green-700">In-app created</dt><dd className="font-semibold text-green-900">{result.appNotifications}</dd></div>
              </dl>
              {result.pushResult && typeof result.pushResult === "object" && "error" in result.pushResult && (
                <p className="mt-3 rounded-lg bg-white/60 px-3 py-2 text-xs text-amber-700">{result.pushResult.error}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
              <svg className="h-6 w-6 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-center text-lg font-semibold text-runway-900">Send Broadcast?</h3>
            <p className="mt-2 text-center text-sm text-runway-500">
              This will notify {selectedCount} {selectedCount === 1 ? "pilot" : "pilots"}. This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-xl border border-runway-300 px-4 py-2.5 text-sm font-medium text-runway-700 transition-colors hover:bg-runway-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
