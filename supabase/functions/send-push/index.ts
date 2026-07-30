// Supabase Edge Function: Send Push Notification
// Deploy with: supabase functions deploy send-push
//
// Triggered by database webhooks or called directly to send push notifications.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface PushPayload {
  /** Target user IDs to notify */
  userIds: string[];
  /** Notification title */
  title: string;
  /** Notification body text */
  body: string;
  /** Additional data payload */
  data?: Record<string, unknown>;
  /** Android channel ID */
  channelId?: string;
  /** Badge count */
  badge?: number;
  /** Sound */
  sound?: string;
}

serve(async (req) => {
  try {
    const payload: PushPayload = await req.json();
    const { userIds, title, body, data, channelId, badge, sound } = payload;

    if (!userIds || !title || !body) {
      return new Response(JSON.stringify({ error: "Missing required fields: userIds, title, body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch push tokens for the target users
    const { data: tokens, error } = await supabase
      .from("push_tokens")
      .select("token")
      .in("user_id", userIds);

    if (error || !tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0, error: "No tokens found" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build Expo push messages
    const messages = tokens.map((t) => ({
      to: t.token,
      title,
      body,
      data: data ?? {},
      channelId: channelId ?? "default",
      badge: badge ?? 1,
      sound: sound ?? "default",
      priority: "high",
    }));

    // Send to Expo Push API (batch)
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();

    return new Response(
      JSON.stringify({ sent: messages.length, result }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: "Internal error", details: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
