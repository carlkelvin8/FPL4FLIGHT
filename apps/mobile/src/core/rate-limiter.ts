/**
 * Client-Side Rate Limiter
 * 
 * Prevents spam from the client before requests even reach the server.
 * Works alongside the Supabase Edge Function for server-side enforcement.
 */

interface RateLimit {
  maxRequests: number;
  windowMs: number;
}

const LIMITS: Record<string, RateLimit> = {
  chat_message: { maxRequests: 20, windowMs: 60000 },     // 20 msgs/min
  form_submit: { maxRequests: 5, windowMs: 60000 },       // 5 forms/min
  file_upload: { maxRequests: 3, windowMs: 60000 },       // 3 uploads/min
  reaction: { maxRequests: 30, windowMs: 60000 },         // 30 reactions/min
  channel_create: { maxRequests: 2, windowMs: 300000 },   // 2 channels/5min
};

const requestLog = new Map<string, number[]>();

/**
 * Check if an action is rate-limited.
 * Returns true if allowed, false if blocked.
 */
export function isAllowed(action: string): boolean {
  const limit = LIMITS[action];
  if (!limit) return true; // No limit configured

  const key = action;
  const now = Date.now();
  const windowStart = now - limit.windowMs;

  // Get or create log for this action
  let log = requestLog.get(key) ?? [];
  
  // Remove entries outside the window
  log = log.filter((t) => t > windowStart);
  
  if (log.length >= limit.maxRequests) {
    requestLog.set(key, log);
    return false; // Rate limited
  }

  // Allow and log
  log.push(now);
  requestLog.set(key, log);
  return true;
}

/**
 * Get remaining requests for an action.
 */
export function getRemaining(action: string): number {
  const limit = LIMITS[action];
  if (!limit) return 999;

  const key = action;
  const now = Date.now();
  const windowStart = now - limit.windowMs;
  const log = (requestLog.get(key) ?? []).filter((t) => t > windowStart);

  return Math.max(0, limit.maxRequests - log.length);
}

/**
 * Get seconds until the rate limit resets.
 */
export function getResetIn(action: string): number {
  const limit = LIMITS[action];
  if (!limit) return 0;

  const key = action;
  const log = requestLog.get(key) ?? [];
  if (log.length === 0) return 0;

  const oldestInWindow = log[0]!;
  const resetTime = oldestInWindow + limit.windowMs;
  return Math.max(0, Math.ceil((resetTime - Date.now()) / 1000));
}

/**
 * Decorator: wrap an async function with rate limiting.
 * Throws an error if rate limited.
 */
export async function withRateLimit<T>(
  action: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (!isAllowed(action)) {
    const resetIn = getResetIn(action);
    throw new Error(`Rate limited. Try again in ${resetIn}s.`);
  }
  return fn();
}
