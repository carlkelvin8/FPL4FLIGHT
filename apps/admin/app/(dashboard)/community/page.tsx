"use client";

import { useEffect, useState, useMemo } from "react";
import { useSort } from "@/lib/hooks/use-sort";
import { Pagination } from "@/lib/components/pagination";
import { ErrorState } from "@/lib/components/error-state";
import { BulkActionsBar } from "@/lib/components/bulk-actions";
import { ConfirmDialog } from "@/lib/components/confirm-dialog";
import { useToast } from "@/lib/components/toast";

export default function CommunityPage() {
  const { toast } = useToast();
  const [channels, setChannels] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msgPage, setMsgPage] = useState(1);
  const [msgPageSize, setMsgPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: "channel" | "message" } | null>(null);
  const [bulkDelete, setBulkDelete] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/community");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setChannels(json.channels ?? []);
      setMessages(json.messages ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load community data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const { sorted: sortedMessages, sort, toggle } = useSort(messages, "created_at", "desc");

  const channelMap = useMemo(() => new Map(channels.map((ch) => [ch.id, ch.name])), [channels]);

  const filtered = useMemo(() => {
    let result = sortedMessages;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((m) =>
        (m.content || "").toLowerCase().includes(q) ||
        (m.user_name || "").toLowerCase().includes(q) ||
        (channelMap.get(m.channel_id) || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [sortedMessages, search, channelMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / msgPageSize));
  const paginated = filtered.slice((msgPage - 1) * msgPageSize, msgPage * msgPageSize);

  useEffect(() => { setMsgPage(1); }, [search]);

  const handleDeleteChannel = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/community?id=${id}&table=chat_channels`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setChannels((prev) => prev.filter((ch) => ch.id !== id));
      toast("Channel deleted");
    } catch {
      toast("Failed to delete channel", "error");
    }
    setDeleteTarget(null);
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/community?id=${id}&table=community_messages`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
      toast("Message deleted");
    } catch {
      toast("Failed to delete message", "error");
    }
    setDeleteTarget(null);
  };

  const handleBulkDelete = async () => {
    let success = 0;
    for (const id of selected) {
      try {
        const res = await fetch(`/api/v1/community?id=${id}&table=community_messages`, { method: "DELETE" });
        if (res.ok) success++;
      } catch {}
    }
    setMessages((prev) => prev.filter((m) => !selected.has(m.id)));
    toast(`${success} of ${selected.size} messages deleted`);
    setSelected(new Set());
    setBulkDelete(false);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; });
  };

  const toggleAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map((m) => m.id)));
  };

  const sortIcon = (key: string) => {
    if (sort.key !== key) return null;
    return <span className="ml-1 inline-block">{sort.dir === "asc" ? "▲" : "▼"}</span>;
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-runway-300 border-t-brand-500" />
    </div>
  );

  if (error) return (
    <section className="space-y-6">
      <div><h1 className="text-2xl font-semibold text-runway-900">Community</h1><p className="mt-1 text-sm text-runway-500">Chat channels and message moderation.</p></div>
      <ErrorState message={error} onRetry={fetchData} />
    </section>
  );

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-runway-900">Community</h1>
        <p className="mt-1 text-sm text-runway-500">Chat channels and message moderation.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Channels</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{channels.length}</p>
        </div>
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Total Messages</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{messages.length}</p>
        </div>
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Most Active</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">
            {channelMap.get(messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.channel_id) || "—"}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-runway-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-runway-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <input type="text" placeholder="Search messages by content, author, or channel..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-runway-300 bg-white px-3 py-2 text-sm text-runway-900 placeholder-runway-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:max-w-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-runway-200 bg-white">
          <div className="flex items-center justify-between border-b border-runway-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-runway-900">Channels</h2>
          </div>
          <div className="divide-y divide-runway-100">
            {channels.length === 0 && <p className="px-4 py-8 text-center text-sm text-runway-400">No channels.</p>}
            {channels.map((ch: any) => (
              <div key={ch.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-runway-50">
                <span className="text-lg">{ch.icon || "💬"}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-runway-900">{ch.name}</p>
                  {ch.description && <p className="text-xs text-runway-500">{ch.description}</p>}
                </div>
                <span className="text-xs text-runway-400">{messages.filter((m: any) => m.channel_id === ch.id).length} msgs</span>
                <button onClick={() => setDeleteTarget({ id: ch.id, type: "channel" })} className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50">Delete</button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-runway-200 bg-white">
          <div className="flex items-center justify-between border-b border-runway-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-runway-900">Recent Messages</h2>
            {filtered.length !== messages.length && <span className="text-xs text-runway-400">{filtered.length} of {messages.length}</span>}
          </div>

          <BulkActionsBar selectedCount={selected.size} onDeleteSelected={() => setBulkDelete(true)} onClear={() => setSelected(new Set())} />

          <div className="divide-y divide-runway-100">
            {paginated.length === 0 && <p className="px-4 py-8 text-center text-sm text-runway-400">{search ? "No messages matching search." : "No messages."}</p>}
            {paginated.map((m: any) => (
              <div key={m.id} className="flex items-start justify-between px-4 py-3 transition-colors hover:bg-runway-50">
                <div className="flex items-start gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={selected.has(m.id)}
                    onChange={() => toggleSelect(m.id)}
                    className="mt-0.5 rounded border-runway-300 text-brand-600 focus:ring-brand-500"
                  />
                  <div className="flex-1">
                    <p className="text-xs text-runway-400">
                      <span className="font-semibold text-runway-700">{m.user_name || "Unknown"}</span>
                      {" in "}
                      <span className="font-medium text-runway-600">{channelMap.get(m.channel_id) || m.channel_id}</span>
                      {" · "}{new Date(m.created_at).toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-runway-900">{m.content}</p>
                  </div>
                </div>
                <button onClick={() => setDeleteTarget({ id: m.id, type: "message" })} className="ml-3 rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50">Delete</button>
              </div>
            ))}
          </div>

          <Pagination page={msgPage} totalPages={totalPages} totalItems={filtered.length} pageSize={msgPageSize} onPageChange={setMsgPage} onPageSizeChange={(s) => { setMsgPageSize(s); setMsgPage(1); }} />
        </div>
      </div>

      {deleteTarget?.type === "channel" && (
        <ConfirmDialog title="Delete Channel" message="Delete this channel and all its messages?" onConfirm={() => handleDeleteChannel(deleteTarget.id)} onCancel={() => setDeleteTarget(null)} />
      )}
      {deleteTarget?.type === "message" && (
        <ConfirmDialog title="Delete Message" message="Delete this message?" onConfirm={() => handleDeleteMessage(deleteTarget.id)} onCancel={() => setDeleteTarget(null)} />
      )}
      {bulkDelete && (
        <ConfirmDialog title="Delete Selected" message={`Delete ${selected.size} messages?`} confirmLabel={`Delete ${selected.size}`} onConfirm={handleBulkDelete} onCancel={() => setBulkDelete(false)} />
      )}
    </section>
  );
}
