import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ChatMessageRow {
  id: string;
  user_id: string;
  user_name?: string;
  content: string;
  channel_id: string;
  message_type: string;
  is_pinned: boolean;
  created_at: string;
}

export interface ChatChannelRow {
  id: string;
  name: string;
  description: string;
  icon: string;
  created_at: string;
}

export interface BannedUserRow {
  id: string;
  user_id: string;
  user_name?: string;
  reason: string;
  banned_by: string;
  banned_at: string;
}

export class ChatModerationRepository {
  private supabase = createSupabaseServerClient();

  /** List all messages with optional channel filter */
  async listMessages(channelId?: string, limit = 100): Promise<ChatMessageRow[]> {
    let query = this.supabase
      .from("community_messages")
      .select("*, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (channelId) {
      query = query.eq("channel_id", channelId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data ?? []).map((row) => ({
      id: row.id,
      user_id: row.user_id,
      user_name: row.profiles?.full_name ?? undefined,
      content: row.content,
      channel_id: row.channel_id ?? "general",
      message_type: row.message_type ?? "text",
      is_pinned: row.is_pinned ?? false,
      created_at: row.created_at,
    }));
  }

  /** List all channels */
  async listChannels(): Promise<ChatChannelRow[]> {
    const { data, error } = await this.supabase
      .from("chat_channels")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  /** Delete a message */
  async deleteMessage(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("community_messages")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  /** Bulk delete messages */
  async deleteMessages(ids: string[]): Promise<number> {
    const { error } = await this.supabase
      .from("community_messages")
      .delete()
      .in("id", ids);

    if (error) throw new Error(error.message);
    return ids.length;
  }

  /** Toggle pin status */
  async togglePin(id: string): Promise<boolean> {
    const { data } = await this.supabase
      .from("community_messages")
      .select("is_pinned")
      .eq("id", id)
      .single();

    const newPinned = !(data?.is_pinned ?? false);
    const { error } = await this.supabase
      .from("community_messages")
      .update({ is_pinned: newPinned })
      .eq("id", id);

    if (error) throw new Error(error.message);
    return newPinned;
  }

  /** List banned users */
  async listBannedUsers(): Promise<BannedUserRow[]> {
    const { data, error } = await this.supabase
      .from("chat_bans")
      .select("*, profiles(full_name)")
      .order("banned_at", { ascending: false });

    if (error) return []; // Table may not exist yet
    return (data ?? []).map((row) => ({
      id: row.id,
      user_id: row.user_id,
      user_name: row.profiles?.full_name ?? undefined,
      reason: row.reason ?? "",
      banned_by: row.banned_by ?? "",
      banned_at: row.banned_at,
    }));
  }

  /** Ban a user from chat */
  async banUser(userId: string, reason: string, bannedBy: string): Promise<void> {
    const { error } = await this.supabase
      .from("chat_bans")
      .upsert({ user_id: userId, reason, banned_by: bannedBy, banned_at: new Date().toISOString() }, { onConflict: "user_id" });

    if (error) throw new Error(error.message);
  }

  /** Unban a user */
  async unbanUser(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("chat_bans")
      .delete()
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
  }

  /** Get message stats */
  async getStats(): Promise<{ total: number; today: number; pinned: number; channels: number }> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalRes, todayRes, pinnedRes, channelsRes] = await Promise.all([
      this.supabase.from("community_messages").select("id", { count: "exact", head: true }),
      this.supabase.from("community_messages").select("id", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
      this.supabase.from("community_messages").select("id", { count: "exact", head: true }).eq("is_pinned", true),
      this.supabase.from("chat_channels").select("id", { count: "exact", head: true }),
    ]);

    return {
      total: totalRes.count ?? 0,
      today: todayRes.count ?? 0,
      pinned: pinnedRes.count ?? 0,
      channels: channelsRes.count ?? 0,
    };
  }
}
