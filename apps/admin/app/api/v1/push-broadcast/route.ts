import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

interface BroadcastInput {
  title: string;
  body: string;
  type?: string;
  target: "all" | "selected";
  userIds?: string[];
  channelId?: string;
}

export async function GET() {
  try {
    const supabase = createSupabaseServiceClient();

    const { data: tokens } = await supabase
      .from("push_tokens")
      .select("user_id, platform, updated_at");

    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    const tokenUsers = tokens ?? [];
    let audience: Array<{ user_id: string; full_name: string | null; platform: string | null; updated_at: string | null }> = [];

    if (tokenUsers.length > 0) {
      const ids = tokenUsers.map((t) => t.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);

      const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
      audience = tokenUsers.map((t) => ({
        user_id: t.user_id,
        full_name: nameById.get(t.user_id) ?? null,
        platform: t.platform ?? null,
        updated_at: t.updated_at ?? null,
      }));
    }

    return NextResponse.json({
      data: audience,
      tokenCount: tokenUsers.length,
      totalUsers: totalUsers ?? 0,
    }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    const title = typeof input.title === "string" ? input.title.trim() : "";
    const notificationBody = typeof input.body === "string" ? input.body.trim() : "";
    const type = typeof input.type === "string" && input.type.trim() ? input.type.trim() : "broadcast";
    const target = input.target === "selected" ? "selected" : "all";
    const userIds = Array.isArray(input.userIds)
      ? input.userIds.filter((id): id is string => typeof id === "string")
      : [];
    const channelId = typeof input.channelId === "string" && input.channelId.trim()
      ? input.channelId.trim()
      : "default";

    if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
    if (!notificationBody) return NextResponse.json({ error: "Message body is required." }, { status: 400 });
    if (title.length > 200) return NextResponse.json({ error: "Title must be 200 characters or fewer." }, { status: 400 });
    if (notificationBody.length > 2000) return NextResponse.json({ error: "Message body must be 2000 characters or fewer." }, { status: 400 });
    if (target === "selected" && userIds.length === 0) {
      return NextResponse.json({ error: "Select at least one user when targeting specific users." }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();

    // Users with push tokens (Expo devices).
    const { data: tokens } = await supabase
      .from("push_tokens")
      .select("user_id, token");

    const tokenUserIds = [...new Set((tokens ?? []).map((t) => t.user_id))];
    const pushUserIds = target === "all"
      ? tokenUserIds
      : tokenUserIds.filter((id) => userIds.includes(id));

    // Recipients of the in-app notification.
    let appUserIds: string[];
    if (target === "all") {
      const { data: profiles } = await supabase.from("profiles").select("id");
      appUserIds = (profiles ?? []).map((p) => p.id);
    } else {
      appUserIds = [...new Set(userIds)];
    }

    // Record an in-app notification per recipient.
    const rows = appUserIds.map((user_id) => ({
      user_id,
      type,
      title,
      body: notificationBody,
      delivered: false,
    }));

    let insertedIds: string[] = [];
    let insertError: string | null = null;
    if (rows.length > 0) {
      const { data: inserted, error } = await supabase
        .from("notifications")
        .insert(rows)
        .select("id, user_id");
      if (error) insertError = error.message;
      else insertedIds = (inserted ?? []).map((r) => r.id);
    }

    // Send device push via the send-push edge function.
    let pushResult: unknown = null;
    let pushSent = 0;
    if (pushUserIds.length > 0) {
      try {
        const edgeUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-push`;
        const response = await fetch(edgeUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          },
          body: JSON.stringify({
            userIds: pushUserIds,
            title,
            body: notificationBody,
            channelId,
            data: { type },
          }),
        });
        pushResult = await response.json().catch(() => null);
        if (response.ok && typeof (pushResult as { sent?: number })?.sent === "number") {
          pushSent = (pushResult as { sent: number }).sent;
        }
      } catch {
        pushResult = { error: "Push service unavailable. In-app notifications were still delivered." };
      }
    }

    // Mark delivered for recipients that received a device push.
    if (pushSent > 0 && insertedIds.length > 0 && !insertError) {
      const pushUserSet = new Set(pushUserIds);
      const { data: inserted } = await supabase
        .from("notifications")
        .select("id, user_id")
        .in("id", insertedIds);
      const deliveredIds = (inserted ?? []).filter((r) => pushUserSet.has(r.user_id)).map((r) => r.id);
      if (deliveredIds.length > 0) {
        await supabase.from("notifications").update({ delivered: true }).in("id", deliveredIds);
      }
    }

    if (rows.length > 0 && insertError) {
      return NextResponse.json({ error: `Failed to record notifications: ${insertError}` }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        targeted: appUserIds.length,
        pushTargeted: pushUserIds.length,
        pushSent,
        appNotifications: insertedIds.length,
        pushResult,
      },
    }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
