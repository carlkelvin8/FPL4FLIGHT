/**
 * Session Manager
 * 
 * Handles token refresh, session expiry detection, and auto-re-authentication.
 * Supabase handles most of this internally, but this provides hooks for the UI.
 */

import { supabase } from "@core/network";

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

/** Start monitoring session expiry */
export function startSessionMonitor(): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "TOKEN_REFRESHED") {
      if (__DEV__) console.log("[Session] Token refreshed");
    }
    if (event === "SIGNED_OUT") {
      if (__DEV__) console.log("[Session] User signed out");
      stopRefreshTimer();
    }
    if (event === "SIGNED_IN" && session) {
      scheduleRefresh(session.expires_at);
    }
  });

  return () => {
    subscription.unsubscribe();
    stopRefreshTimer();
  };
}

function scheduleRefresh(expiresAt: number | undefined): void {
  if (!expiresAt) return;
  stopRefreshTimer();

  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = (expiresAt - now - 60) * 1000; // Refresh 60s before expiry

  if (timeUntilExpiry > 0) {
    refreshTimer = setTimeout(async () => {
      try {
        await supabase.auth.refreshSession();
      } catch {
        // Will be caught by auth state change listener
      }
    }, timeUntilExpiry);
  }
}

function stopRefreshTimer(): void {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

/** Validate current session is still valid */
export async function validateSession(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      // Expired — try to refresh
      const { error } = await supabase.auth.refreshSession();
      return !error;
    }
    return true;
  } catch {
    return false;
  }
}
