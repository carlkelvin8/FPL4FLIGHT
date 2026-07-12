import { ok, err, type Result } from "@pilotforms/shared";

import { supabase } from "@core/network";

import type { ChatMessage, ChatMessageRow } from "../types";

const MESSAGES_PAGE_SIZE = 50;

function rowToMessage(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    userId: row.user_id,
    content: row.content,
    createdAt: new Date(row.created_at),
  };
}

export class ChatRepository {
  async fetchMessages(before?: string): Promise<Result<ChatMessage[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return err("UNAUTHORIZED", "Not authenticated.");

      let query = supabase
        .from("community_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(MESSAGES_PAGE_SIZE);

      if (before) {
        query = query.lt("created_at", before);
      }

      const { data, error } = await query;

      if (error) return err("DB_ERROR", error.message, error);
      return ok((data ?? []).map(rowToMessage).reverse());
    } catch (e) {
      return err("NETWORK_ERROR", "Network error fetching messages.", e);
    }
  }

  async sendMessage(content: string): Promise<Result<ChatMessage>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return err("UNAUTHORIZED", "Not authenticated.");

      const trimmed = content.trim();
      if (!trimmed) return err("VALIDATION", "Message cannot be empty.");
      if (trimmed.length > 2000) return err("VALIDATION", "Message too long (max 2000 characters).");

      const { data, error } = await supabase
        .from("community_messages")
        .insert({ user_id: user.id, content: trimmed })
        .select()
        .single();

      if (error) return err("DB_ERROR", error.message, error);
      return ok(rowToMessage(data as ChatMessageRow));
    } catch (e) {
      return err("NETWORK_ERROR", "Network error sending message.", e);
    }
  }

  async deleteMessage(id: string): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from("community_messages")
        .delete()
        .eq("id", id);

      if (error) return err("DB_ERROR", error.message, error);
      return ok(undefined);
    } catch (e) {
      return err("NETWORK_ERROR", "Network error deleting message.", e);
    }
  }

  subscribe(callback: (message: ChatMessage) => void) {
    const subscription = supabase
      .channel("community_messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_messages" },
        (payload) => {
          const row = payload.new as ChatMessageRow;
          callback(rowToMessage(row));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(subscription);
    };
  }
}

export const chatRepository = new ChatRepository();
