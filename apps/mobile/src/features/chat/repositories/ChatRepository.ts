import { ok, err, type Result } from "@pilotforms/shared";

import { supabase } from "@core/network";

import type {
  ChatMessage,
  ChatMessageRow,
  ChatChannel,
  ChatChannelRow,
  TypingUser,
  OnlineMember,
  MessageReaction,
  ReactionRow,
  MessageType,
  ChannelUnread,
} from "../types";

const MESSAGES_PAGE_SIZE = 50;

export const REACTION_EMOJIS = ["👍", "✈️", "🎯", "❤️", "😂", "🔥"];

const AVATAR_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b",
  "#10b981", "#06b6d4", "#3b82f6", "#f97316", "#14b8a6",
];

function hashUserId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function rowToMessage(
  row: ChatMessageRow,
  profileMap: Map<string, string>,
  reactionsMap: Map<string, MessageReaction[]>,
): ChatMessage {
  const color = AVATAR_COLORS[hashUserId(row.user_id) % AVATAR_COLORS.length];
  const msg: ChatMessage = {
    id: row.id,
    userId: row.user_id,
    content: row.content ?? "",
    createdAt: new Date(row.created_at),
    reactions: reactionsMap.get(row.id) ?? [],
    type: (row.message_type as MessageType) ?? "text",
  };
  const name = profileMap.get(row.user_id);
  if (name) msg.displayName = name;
  if (color) msg.avatarColor = color;
  if (row.reply_to_id && row.reply_to_content) {
    msg.replyTo = {
      messageId: row.reply_to_id,
      userId: row.user_id,
      displayName: row.reply_to_user_name ?? "Unknown",
      content: row.reply_to_content,
    };
  }
  if (row.image_url) msg.imageUrl = row.image_url;
  if (row.voice_url) msg.voiceUrl = row.voice_url;
  if (row.voice_duration) msg.voiceDuration = row.voice_duration;
  if (row.latitude != null) msg.latitude = row.latitude;
  if (row.longitude != null) msg.longitude = row.longitude;
  if (row.is_pinned) msg.isPinned = true;
  if (row.mentions && row.mentions.length > 0) msg.mentions = row.mentions;
  return msg;
}

function rowToChannel(row: ChatChannelRow): ChatChannel {
  return { id: row.id, name: row.name, description: row.description, icon: row.icon, createdAt: new Date(row.created_at) };
}

function aggregateReactions(rows: ReactionRow[]): Map<string, MessageReaction[]> {
  const map = new Map<string, MessageReaction[]>();
  for (const row of rows) {
    if (!map.has(row.message_id)) map.set(row.message_id, []);
    const reactions = map.get(row.message_id)!;
    const existing = reactions.find((r) => r.emoji === row.emoji);
    if (existing) { existing.userIds.push(row.user_id); existing.count++; }
    else { reactions.push({ emoji: row.emoji, userIds: [row.user_id], count: 1 }); }
  }
  return map;
}

export class ChatRepository {
  // ─── Channels ─────────────────────────────────────────────

  async fetchChannels(): Promise<Result<ChatChannel[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return err("UNAUTHORIZED", "Not authenticated.");
      const { data, error } = await supabase.from("chat_channels").select("*").order("created_at", { ascending: true });
      if (error) return ok(this.getDefaultChannels());
      const channels = (data ?? []).map(rowToChannel);
      return ok(channels.length > 0 ? channels : this.getDefaultChannels());
    } catch { return ok(this.getDefaultChannels()); }
  }

  async createChannel(name: string, description: string, icon: string): Promise<Result<ChatChannel>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return err("UNAUTHORIZED", "Not authenticated.");
      const trimmedName = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      if (!trimmedName) return err("VALIDATION", "Channel name is required.");
      const { data, error } = await supabase.from("chat_channels").insert({ id: trimmedName, name: trimmedName, description: description.trim(), icon: icon || "chatbubble-outline", created_by: user.id }).select("*").single();
      if (error) return err("DB_ERROR", error.message, error);
      return ok(rowToChannel(data as ChatChannelRow));
    } catch (e) { return err("NETWORK_ERROR", "Network error.", e); }
  }

  // ─── Messages ─────────────────────────────────────────────

  async fetchMessages(channelId: string, before?: string): Promise<Result<ChatMessage[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return err("UNAUTHORIZED", "Not authenticated.");
      let query = supabase.from("community_messages").select("*").or(`channel_id.eq.${channelId},channel_id.is.null`).order("created_at", { ascending: false }).limit(MESSAGES_PAGE_SIZE);
      if (before) query = query.lt("created_at", before);
      const { data, error } = await query;
      if (error) return this.fetchMessagesLegacy(before);
      const rows = (data ?? []) as ChatMessageRow[];
      const userIds = [...new Set(rows.map((r) => r.user_id))];
      const profileMap = await this.fetchProfileNames(userIds);
      const reactionsMap = await this.fetchReactions(rows.map((r) => r.id));
      return ok(rows.map((r) => rowToMessage(r, profileMap, reactionsMap)).reverse());
    } catch (e) { return err("NETWORK_ERROR", "Network error.", e); }
  }

  private async fetchMessagesLegacy(before?: string): Promise<Result<ChatMessage[]>> {
    try {
      let query = supabase.from("community_messages").select("*").order("created_at", { ascending: false }).limit(MESSAGES_PAGE_SIZE);
      if (before) query = query.lt("created_at", before);
      const { data, error } = await query;
      if (error) return err("DB_ERROR", error.message, error);
      const rows = (data ?? []) as ChatMessageRow[];
      const userIds = [...new Set(rows.map((r) => r.user_id))];
      const profileMap = await this.fetchProfileNames(userIds);
      const reactionsMap = await this.fetchReactions(rows.map((r) => r.id));
      return ok(rows.map((r) => rowToMessage(r, profileMap, reactionsMap)).reverse());
    } catch (e) { return err("NETWORK_ERROR", "Network error.", e); }
  }

  async sendMessage(
    channelId: string,
    content: string,
    options?: {
      replyTo?: { id: string; userName: string; content: string };
      type?: MessageType;
      imageUrl?: string;
      voiceUrl?: string;
      voiceDuration?: number;
      latitude?: number;
      longitude?: number;
      mentions?: string[];
    },
  ): Promise<Result<ChatMessage>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return err("UNAUTHORIZED", "Not authenticated.");
      const trimmed = content.trim();
      if (!trimmed && options?.type === "text") return err("VALIDATION", "Message cannot be empty.");

      const payload: Record<string, any> = {
        user_id: user.id,
        content: trimmed || (options?.type === "image" ? "📷 Photo" : options?.type === "voice" ? "🎤 Voice note" : options?.type === "location" ? "📍 Location" : ""),
        channel_id: channelId,
        message_type: options?.type ?? "text",
      };
      if (options?.replyTo) {
        payload.reply_to_id = options.replyTo.id;
        payload.reply_to_user_name = options.replyTo.userName;
        payload.reply_to_content = options.replyTo.content.substring(0, 100);
      }
      if (options?.imageUrl) payload.image_url = options.imageUrl;
      if (options?.voiceUrl) payload.voice_url = options.voiceUrl;
      if (options?.voiceDuration) payload.voice_duration = options.voiceDuration;
      if (options?.latitude != null) payload.latitude = options.latitude;
      if (options?.longitude != null) payload.longitude = options.longitude;
      if (options?.mentions && options.mentions.length > 0) payload.mentions = options.mentions;

      const { data, error } = await supabase.from("community_messages").insert(payload).select("*").single();
      if (error) {
        // Fallback
        const { data: fb, error: fbe } = await supabase.from("community_messages").insert({ user_id: user.id, content: trimmed }).select("*").single();
        if (fbe) return err("DB_ERROR", fbe.message, fbe);
        return ok(rowToMessage(fb as ChatMessageRow, new Map(), new Map()));
      }
      return ok(rowToMessage(data as ChatMessageRow, new Map(), new Map()));
    } catch (e) { return err("NETWORK_ERROR", "Network error.", e); }
  }

  async deleteMessage(id: string): Promise<Result<void>> {
    try {
      const { error } = await supabase.from("community_messages").delete().eq("id", id);
      if (error) return err("DB_ERROR", error.message, error);
      return ok(undefined);
    } catch (e) { return err("NETWORK_ERROR", "Network error.", e); }
  }

  async editMessage(id: string, newContent: string): Promise<Result<void>> {
    try {
      const trimmed = newContent.trim();
      if (!trimmed) return err("VALIDATION", "Message cannot be empty.");
      const { error } = await supabase.from("community_messages").update({ content: trimmed }).eq("id", id);
      if (error) return err("DB_ERROR", error.message, error);
      return ok(undefined);
    } catch (e) { return err("NETWORK_ERROR", "Network error.", e); }
  }

  // ─── Pin Messages ─────────────────────────────────────────

  async togglePin(messageId: string): Promise<Result<void>> {
    try {
      const { data } = await supabase.from("community_messages").select("is_pinned").eq("id", messageId).single();
      const isPinned = data?.is_pinned ?? false;
      const { error } = await supabase.from("community_messages").update({ is_pinned: !isPinned }).eq("id", messageId);
      if (error) return err("DB_ERROR", error.message, error);
      return ok(undefined);
    } catch (e) { return err("NETWORK_ERROR", "Network error.", e); }
  }

  async fetchPinnedMessages(channelId: string): Promise<Result<ChatMessage[]>> {
    try {
      const { data, error } = await supabase.from("community_messages").select("*").eq("channel_id", channelId).eq("is_pinned", true).order("created_at", { ascending: false }).limit(20);
      if (error) return ok([]);
      const rows = (data ?? []) as ChatMessageRow[];
      const userIds = [...new Set(rows.map((r) => r.user_id))];
      const profileMap = await this.fetchProfileNames(userIds);
      return ok(rows.map((r) => rowToMessage(r, profileMap, new Map())));
    } catch { return ok([]); }
  }

  // ─── Search ───────────────────────────────────────────────

  async searchMessages(channelId: string, query: string): Promise<Result<ChatMessage[]>> {
    try {
      // Escape SQL LIKE wildcards to prevent pattern injection
      const searchTerm = query.trim().toLowerCase().replace(/%/g, "\\%").replace(/_/g, "\\_");
      if (!searchTerm) return ok([]);
      const { data, error } = await supabase.from("community_messages").select("*").or(`channel_id.eq.${channelId},channel_id.is.null`).ilike("content", `%${searchTerm}%`).order("created_at", { ascending: false }).limit(30);
      if (error) return err("DB_ERROR", error.message, error);
      const rows = (data ?? []) as ChatMessageRow[];
      const userIds = [...new Set(rows.map((r) => r.user_id))];
      const profileMap = await this.fetchProfileNames(userIds);
      return ok(rows.map((r) => rowToMessage(r, profileMap, new Map())).reverse());
    } catch (e) { return err("NETWORK_ERROR", "Network error.", e); }
  }

  // ─── Unread ───────────────────────────────────────────────

  async getUnreadCounts(channelIds: string[], lastReadMap: Map<string, string>): Promise<ChannelUnread[]> {
    const unreads: ChannelUnread[] = [];
    for (const channelId of channelIds) {
      try {
        const lastRead = lastReadMap.get(channelId);
        let query = supabase.from("community_messages").select("id", { count: "exact", head: true }).eq("channel_id", channelId);
        if (lastRead) query = query.gt("created_at", lastRead);
        const { count } = await query;
        unreads.push({ channelId, count: count ?? 0 });
      } catch {
        unreads.push({ channelId, count: 0 });
      }
    }
    return unreads;
  }

  // ─── File Upload ──────────────────────────────────────────

  async uploadFile(uri: string, bucket: string, fileName: string): Promise<Result<string>> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      // File size validation (10MB max for images, 25MB for audio)
      const maxSize = fileName.endsWith(".m4a") || fileName.endsWith(".mp3") ? 25 * 1024 * 1024 : 10 * 1024 * 1024;
      if (blob.size > maxSize) {
        const maxMB = maxSize / (1024 * 1024);
        return err("VALIDATION", `File too large. Maximum size is ${maxMB}MB.`);
      }

      // Content-type validation
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "audio/mp4", "audio/mpeg", "audio/m4a", "audio/aac"];
      const contentType = blob.type || "application/octet-stream";
      if (contentType !== "application/octet-stream" && !allowedTypes.includes(contentType)) {
        return err("VALIDATION", "Unsupported file type. Only images and audio are allowed.");
      }

      const arrayBuffer = await blob.arrayBuffer();

      const { data, error } = await supabase.storage.from(bucket).upload(fileName, arrayBuffer, {
        contentType,
        upsert: false,
      });

      if (error) return err("UPLOAD_ERROR", error.message, error);
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      return ok(urlData.publicUrl);
    } catch (e) { return err("NETWORK_ERROR", "Upload failed.", e); }
  }

  // ─── Fetch Members (for @mentions autocomplete) ───────────

  async fetchAllMembers(): Promise<Result<Array<{ id: string; name: string }>>> {
    try {
      const { data } = await supabase.from("profiles").select("id, full_name").limit(100);
      return ok((data ?? []).map((r) => ({ id: r.id, name: r.full_name ?? r.id.substring(0, 8) })));
    } catch { return ok([]); }
  }

  // ─── Reactions ────────────────────────────────────────────

  private async fetchReactions(messageIds: string[]): Promise<Map<string, MessageReaction[]>> {
    if (messageIds.length === 0) return new Map();
    try {
      const { data } = await supabase.from("message_reactions").select("*").in("message_id", messageIds);
      return aggregateReactions((data ?? []) as ReactionRow[]);
    } catch { return new Map(); }
  }

  async toggleReaction(messageId: string, emoji: string): Promise<Result<void>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return err("UNAUTHORIZED", "Not authenticated.");
      const { data: existing } = await supabase.from("message_reactions").select("id").eq("message_id", messageId).eq("user_id", user.id).eq("emoji", emoji).maybeSingle();
      if (existing) { await supabase.from("message_reactions").delete().eq("id", existing.id); }
      else { await supabase.from("message_reactions").insert({ message_id: messageId, user_id: user.id, emoji }); }
      return ok(undefined);
    } catch (e) { return err("NETWORK_ERROR", "Network error.", e); }
  }

  // ─── Presence ─────────────────────────────────────────────

  subscribePresence(channelId: string, currentUserId: string, displayName: string, onUpdate: (members: OnlineMember[]) => void) {
    const channel = supabase.channel(`presence_${channelId}`, { config: { presence: { key: currentUserId } } });
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<{ displayName: string }>();
      const members: OnlineMember[] = [];
      for (const [userId, presences] of Object.entries(state)) {
        const latest = presences[presences.length - 1];
        members.push({ userId, displayName: latest?.displayName ?? userId.substring(0, 8) });
      }
      onUpdate(members);
    }).subscribe();
    channel.track({ displayName }).catch(() => {});
    return { cleanup: () => { channel.untrack().catch(() => {}); void supabase.removeChannel(channel); } };
  }

  subscribe(channelId: string, callback: (message: ChatMessage) => void) {
    const sub = supabase.channel(`messages_${channelId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "community_messages" }, (payload) => {
      const row = payload.new as ChatMessageRow;
      if (row.channel_id && row.channel_id !== channelId) return;
      callback(rowToMessage(row, new Map(), new Map()));
    }).subscribe();
    return () => { void supabase.removeChannel(sub); };
  }

  subscribeTyping(channelId: string, currentUserId: string, onTyping: (users: TypingUser[]) => void) {
    const channel = supabase.channel(`typing_${channelId}`, { config: { presence: { key: currentUserId } } });
    const typingUsers = new Map<string, TypingUser>();
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<{ displayName: string; typing: boolean }>();
      typingUsers.clear();
      for (const [userId, presences] of Object.entries(state)) {
        if (userId === currentUserId) continue;
        const latest = presences[presences.length - 1];
        if (latest?.typing) typingUsers.set(userId, { userId, displayName: latest.displayName ?? userId.substring(0, 8), timestamp: Date.now() });
      }
      onTyping(Array.from(typingUsers.values()));
    }).subscribe();
    const sendTyping = (dn: string) => { channel.track({ typing: true, displayName: dn }).catch(() => {}); };
    const stopTyping = () => { channel.track({ typing: false, displayName: "" }).catch(() => {}); };
    const cleanup = () => { channel.untrack().catch(() => {}); void supabase.removeChannel(channel); };
    return { sendTyping, stopTyping, cleanup };
  }

  // ─── Helpers ──────────────────────────────────────────────

  private async fetchProfileNames(userIds: string[]): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (userIds.length === 0) return map;
    try {
      const { data } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
      if (data) {
        for (const row of data) {
          if (row.full_name) {
            map.set(row.id, row.full_name);
          }
        }
      }
      // For users without full_name, try to get their email from current session
      // This ensures at least the current user shows their email-based name
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser && !map.has(currentUser.id)) {
        const emailName = currentUser.email?.split("@")[0] ?? "Pilot";
        map.set(currentUser.id, emailName);
      }
    } catch { /* non-critical */ }
    return map;
  }

  private getDefaultChannels(): ChatChannel[] {
    return [
      { id: "general", name: "general", description: "General pilot discussion", icon: "chatbubbles-outline", createdAt: new Date() },
      { id: "flight-ops", name: "flight-ops", description: "Flight operations & planning", icon: "airplane-outline", createdAt: new Date() },
      { id: "weather", name: "weather", description: "Weather reports & METAR discussion", icon: "cloud-outline", createdAt: new Date() },
      { id: "atc", name: "atc", description: "ATC communications", icon: "radio-outline", createdAt: new Date() },
      { id: "random", name: "random", description: "Off-topic chat", icon: "cafe-outline", createdAt: new Date() },
    ];
  }
}

export const chatRepository = new ChatRepository();
