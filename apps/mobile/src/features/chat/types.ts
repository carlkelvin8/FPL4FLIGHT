// ─── Message Types ──────────────────────────────────────────

export type MessageType = "text" | "image" | "voice" | "location";

export interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  displayName?: string | undefined;
  avatarColor?: string | undefined;
  reactions: MessageReaction[];
  replyTo?: ReplyContext | undefined;
  /** Message type for rich content */
  type: MessageType;
  /** Image URL (for image messages) */
  imageUrl?: string | undefined;
  /** Voice note URL + duration (for voice messages) */
  voiceUrl?: string | undefined;
  voiceDuration?: number | undefined;
  /** Location data (for location messages) */
  latitude?: number | undefined;
  longitude?: number | undefined;
  /** Whether this message is pinned */
  isPinned?: boolean | undefined;
  /** Mentioned user IDs */
  mentions?: string[] | undefined;
}

export interface MessageReaction {
  emoji: string;
  userIds: string[];
  count: number;
}

export interface ReplyContext {
  messageId: string;
  userId: string;
  displayName: string;
  content: string;
}

export interface ChatMessageRow {
  id: string;
  user_id: string;
  content: string;
  channel_id: string;
  created_at: string;
  reply_to_id?: string | null;
  reply_to_user_name?: string | null;
  reply_to_content?: string | null;
  message_type?: string | null;
  image_url?: string | null;
  voice_url?: string | null;
  voice_duration?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  is_pinned?: boolean | null;
  mentions?: string[] | null;
}

export interface ReactionRow {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

// ─── Channel Types ──────────────────────────────────────────

export interface ChatChannel {
  id: string;
  name: string;
  description: string;
  icon: string;
  createdAt: Date;
}

export interface ChatChannelRow {
  id: string;
  name: string;
  description: string;
  icon: string;
  created_at: string;
}

// ─── Presence Types ─────────────────────────────────────────

export interface TypingUser {
  userId: string;
  displayName: string;
  timestamp: number;
}

export interface OnlineMember {
  userId: string;
  displayName: string;
}

// ─── Search Types ───────────────────────────────────────────

export interface SearchResult {
  message: ChatMessage;
  highlight: string;
}

// ─── Unread Types ───────────────────────────────────────────

export interface ChannelUnread {
  channelId: string;
  count: number;
}
