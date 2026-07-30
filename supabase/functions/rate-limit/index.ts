// Supabase Edge Function: Rate Limiter
// Deploy with: supabase functions deploy rate-limit
//
// This function acts as a middleware for rate-limiting API calls.
// Call it before sensitive operations (chat messages, form submissions, etc.)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface RateLimitConfig {
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  "chat_message": { maxRequests: 30, windowSeconds: 60 },      // 30 msgs/min
  "form_submit": { maxRequests: 10, windowSeconds: 60 },       // 10 forms/min
  "file_upload": { maxRequests: 5, windowSeconds: 60 },        // 5 uploads/min
  "channel_create": { maxRequests: 3, windowSeconds: 300 },    // 3 channels/5min
  "reaction": { maxRequests: 60, windowSeconds: 60 },          // 60 reactions/min
  "default": { maxRequests: 100, windowSeconds: 60 },          // 100 req/min default
};

serve(async (req) => {
  try {
    const { action, userId } = await req.json();

    if (!userId || !action) {
      return new Response(JSON.stringify({ error: "Missing userId or action" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const config = RATE_LIMITS[action] ?? RATE_LIMITS["default"]!;
    const windowStart = new Date(Date.now() - config.windowSeconds * 1000).toISOString();
    const key = `${userId}:${action}`;

    // Count recent requests from this user for this action
    const { count, error } = await supabase
      .from("rate_limit_log")
      .select("id", { count: "exact", head: true })
      .eq("key", key)
      .gte("created_at", windowStart);

    if (error) {
      // If table doesn't exist, allow the request (degraded mode)
      return new Response(JSON.stringify({ allowed: true, remaining: config.maxRequests }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const currentCount = count ?? 0;
    const allowed = currentCount < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - currentCount - 1);

    if (allowed) {
      // Log this request
      await supabase.from("rate_limit_log").insert({ key, action, user_id: userId });
    }

    // Cleanup old entries (older than 10 minutes)
    const cleanupTime = new Date(Date.now() - 600000).toISOString();
    await supabase.from("rate_limit_log").delete().lt("created_at", cleanupTime);

    return new Response(
      JSON.stringify({
        allowed,
        remaining,
        limit: config.maxRequests,
        window: config.windowSeconds,
        retryAfter: allowed ? 0 : config.windowSeconds,
      }),
      {
        status: allowed ? 200 : 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": String(config.maxRequests),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(config.windowSeconds),
        },
      },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: "Internal error", allowed: true }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
