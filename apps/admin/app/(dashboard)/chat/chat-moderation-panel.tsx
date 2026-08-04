"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { ChatMessageRow, ChatChannelRow } from "@/features/chat-moderation";
import { deleteMessage, deleteMessages, togglePinMessage, banUser } from "@/features/chat-moderation";

interface Props {
  messages: ChatMessageRow[];
  channels: ChatChannelRow[];
}

const TYPE_ICONS: Record<string, string> = {
  text: "💬",
  image: "🖼️",
  voice: "🎤",
  location: "📍",
};

export function ChatModerationPanel({ messages: initial, channels }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState(initial);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banModal, setBanModal] = useState<{ userId: string; userName: string } | null>(null);
  const [banReason, setBanReason] = useState("");

  const filtered = useMemo(() => {
    let result = messages;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) => m.content.toLowerCase().includes(q) || (m.user_name ?? "").toLowerCase().includes(q)
      );
    }
    if (channelFilter) {
      result = result.filter((m) => m.channel_id === channelFilter);
    }
    if (typeFilter) {
      result = result.filter((m) => m.message_type === typeFilter);
    }
    return result;
  }, [messages, search, channelFilter, typeFilter]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((m) => m.id)));
  };

  async function handleDelete(id: string) {
    setActionLoading(true);
    setError(null);
    const result = await deleteMessage(id);
    if (result.error) setError(result.error);
    else {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }
    setActionLoading(false);
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} messages? This cannot be undone.`)) return;
    setActionLoading(true);
    setError(null);
    const result = await deleteMessages([...selected]);
    if (result.error) setError(result.error);
    else {
      setMessages((prev) => prev.filter((m) => !selected.has(m.id)));
      setSelected(new Set());
    }
    setActionLoading(false);
    router.refresh();
  }

  async function handleTogglePin(id: string) {
    setActionLoading(true);
    const result = await togglePinMessage(id);
    if (result.error) setError(result.error);
    else {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_pinned: result.pinned ?? !m.is_pinned } : m))
      );
    }
    setActionLoading(false);
  }

  async function handleBan() {
    if (!banModal) return;
    setActionLoading(true);
    setError(null);
    const result = await banUser(banModal.userId, banReason);
    if (result.error) setError(result.error);
    setBanModal(null);
    setBanReason("");
    setActionLoading(false);
    router.refresh();
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-runway-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search messages or users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-runway-300 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm transition-colors focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
        </div>
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="rounded-xl border border-runway-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        >
          <option value="">All channels</option>
          {channels.map((ch) => (
            <option key={ch.id} value={ch.id}>#{ch.name}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-runway-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        >
          <option value="">All types</option>
          <option value="text">Text</option>
          <option value="image">Image</option>
          <option value="voice">Voice</option>
          <option value="location">Location</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
          <span className="text-sm font-medium text-brand-700">{selected.size} selected</span>
          <button
            onClick={handleBulkDelete}
            disabled={actionLoading}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            Delete Selected
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="rounded-lg border border-runway-300 px-3 py-1.5 text-xs font-medium text-runway-600 transition-colors hover:bg-runway-50"
          >
            Clear
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</div>
      )}

      {/* Messages Table */}
      <div className="overflow-hidden rounded-2xl border border-runway-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-runway-200">
            <thead className="bg-runway-50">
              <tr>
                <th className="w-10 px-4 py-3.5 text-left">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onChange={toggleAll}
                    className="rounded border-runway-300 text-brand-600 focus:ring-brand-500"
                  />
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-runway-500">User</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-runway-500">Message</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-runway-500">Channel</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-runway-500">Type</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-runway-500">Time</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-runway-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-runway-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-runway-400">
                    {search || channelFilter || typeFilter ? "No messages match your filters." : "No messages yet."}
                  </td>
                </tr>
              )}
              {filtered.slice(0, 50).map((msg) => (
                <tr key={msg.id} className="transition-colors hover:bg-runway-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(msg.id)}
                      onChange={() => toggleSelect(msg.id)}
                      className="rounded border-runway-300 text-brand-600 focus:ring-brand-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-runway-900">
                    {msg.user_name || <span className="font-mono text-runway-400">{msg.user_id.slice(0, 8)}…</span>}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-sm text-runway-700">
                    <div className="flex items-center gap-2">
                      {msg.is_pinned && <span className="text-amber-500" title="Pinned">📌</span>}
                      <span className="truncate">{msg.content || <em className="text-runway-400">[{msg.message_type}]</em>}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-runway-100 px-2.5 py-0.5 text-xs font-medium text-runway-600">
                      #{msg.channel_id}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span title={msg.message_type}>{TYPE_ICONS[msg.message_type] ?? "💬"}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-runway-500">
                    {new Date(msg.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleTogglePin(msg.id)}
                        disabled={actionLoading}
                        className="rounded-lg border border-runway-200 px-2.5 py-1.5 text-xs font-medium text-runway-600 transition-colors hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50"
                        title={msg.is_pinned ? "Unpin" : "Pin"}
                      >
                        {msg.is_pinned ? "Unpin" : "Pin"}
                      </button>
                      <button
                        onClick={() => setBanModal({ userId: msg.user_id, userName: msg.user_name ?? msg.user_id.slice(0, 8) })}
                        className="rounded-lg border border-orange-200 px-2.5 py-1.5 text-xs font-medium text-orange-600 transition-colors hover:bg-orange-50"
                        title="Ban user"
                      >
                        Ban
                      </button>
                      <button
                        onClick={() => handleDelete(msg.id)}
                        disabled={actionLoading}
                        className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 50 && (
          <div className="border-t border-runway-200 px-4 py-3 text-center text-xs text-runway-400">
            Showing 50 of {filtered.length} messages. Use filters to narrow results.
          </div>
        )}
      </div>

      {/* Ban User Modal */}
      {banModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-2 text-lg font-semibold text-runway-900">Ban User from Chat</h2>
            <p className="mb-4 text-sm text-runway-500">
              Ban <strong className="text-runway-800">{banModal.userName}</strong> from all chat channels.
            </p>
            <div className="mb-4">
              <label htmlFor="ban-reason" className="mb-1.5 block text-sm font-medium text-runway-700">Reason</label>
              <textarea
                id="ban-reason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Reason for ban (optional)..."
                rows={3}
                className="w-full rounded-lg border border-runway-300 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setBanModal(null); setBanReason(""); }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-runway-700 transition-colors hover:bg-runway-100"
              >
                Cancel
              </button>
              <button
                onClick={handleBan}
                disabled={actionLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? "Banning..." : "Ban User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
