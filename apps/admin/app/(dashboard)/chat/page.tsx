import { ChatModerationRepository } from "@/features/chat-moderation";
import { ChatModerationPanel } from "./chat-moderation-panel";

export default async function ChatModerationPage() {
  const repo = new ChatModerationRepository();

  const [messages, channels, stats] = await Promise.all([
    repo.listMessages(undefined, 200).catch(() => []),
    repo.listChannels().catch(() => []),
    repo.getStats().catch(() => ({ total: 0, today: 0, pinned: 0, channels: 0 })),
  ]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-runway-900">Chat Moderation</h1>
        <p className="mt-1 text-sm text-runway-500">Manage messages, pin content, and moderate users.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Total Messages</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{stats.total.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Today</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{stats.today}</p>
        </div>
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Pinned</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{stats.pinned}</p>
        </div>
        <div className="rounded-xl border border-runway-200 bg-white p-5">
          <p className="text-sm font-medium text-runway-500">Channels</p>
          <p className="mt-1 text-2xl font-semibold text-runway-900">{stats.channels}</p>
        </div>
      </div>

      <ChatModerationPanel messages={messages} channels={channels} />
    </section>
  );
}
