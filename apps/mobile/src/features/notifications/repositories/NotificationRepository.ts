import { ok, err, type Result } from "@pilotforms/shared";

import { supabase } from "@core/network";

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  delivered: boolean;
  createdAt: Date;
}

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  delivered: boolean;
  created_at: string;
}

function rowToNotification(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    read: row.read,
    delivered: row.delivered,
    createdAt: new Date(row.created_at),
  };
}

export class NotificationRepository {
  async findAll(): Promise<Result<NotificationItem[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return err("UNAUTHORIZED", "Not authenticated.");

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) return err("DB_ERROR", error.message, error);
      return ok((data ?? []).map(rowToNotification));
    } catch (e) {
      return err("NETWORK_ERROR", "Network error fetching notifications.", e);
    }
  }

  async markRead(id: string): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);

      if (error) return err("DB_ERROR", error.message, error);
      return ok(undefined);
    } catch (e) {
      return err("NETWORK_ERROR", "Network error marking notification read.", e);
    }
  }

  async markAllRead(): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("read", false);

      if (error) return err("DB_ERROR", error.message, error);
      return ok(undefined);
    } catch (e) {
      return err("NETWORK_ERROR", "Network error marking all read.", e);
    }
  }

  subscribe(callback: (notification: NotificationItem) => void) {
    const subscription = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const row = payload.new as NotificationRow;
          callback(rowToNotification(row));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(subscription);
    };
  }
}

export const notificationRepository = new NotificationRepository();
