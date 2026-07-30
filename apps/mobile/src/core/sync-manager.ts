/**
 * Sync Manager
 * 
 * Integrates offline-sync queue with network detection.
 * When offline: queues operations locally.
 * When online: processes the queue and syncs to Supabase.
 */

import { AppState, AppStateStatus } from "react-native";
import { supabase } from "@core/network";
import { queueOperation, processSyncQueue, getPendingSyncCount, clearSyncedItems } from "@core/offline-sync";

let isOnline = true;
let syncInProgress = false;

/** Check if we're currently online by pinging Supabase */
export async function checkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch("https://tajflaaiezwlbkgyfnkh.supabase.co/rest/v1/", {
      method: "HEAD",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    isOnline = response.ok;
  } catch {
    isOnline = false;
  }
  return isOnline;
}

/** Get current online status */
export function getIsOnline(): boolean {
  return isOnline;
}

/** Start the sync manager — monitors connectivity and syncs when possible */
export function startSyncManager(): () => void {
  // Check connectivity periodically
  const intervalId = setInterval(async () => {
    const wasOffline = !isOnline;
    await checkConnectivity();

    // If we just came back online, trigger sync
    if (wasOffline && isOnline) {
      console.log("[Sync] Back online — processing queue...");
      await triggerSync();
    }
  }, 15000); // Check every 15 seconds

  // Also sync on app foreground
  const appStateListener = AppState.addEventListener("change", async (state: AppStateStatus) => {
    if (state === "active") {
      await checkConnectivity();
      if (isOnline) await triggerSync();
    }
  });

  return () => {
    clearInterval(intervalId);
    appStateListener.remove();
  };
}

/** Trigger a sync cycle */
export async function triggerSync(): Promise<{ synced: number; failed: number }> {
  if (syncInProgress) return { synced: 0, failed: 0 };
  syncInProgress = true;

  try {
    const result = await processSyncQueue();
    if (result.synced > 0) {
      await clearSyncedItems();
      console.log(`[Sync] Synced ${result.synced} items, ${result.failed} failed`);
    }
    return result;
  } catch (error) {
    console.error("[Sync] Error:", error);
    return { synced: 0, failed: 0 };
  } finally {
    syncInProgress = false;
  }
}

/** Get pending sync count */
export async function getPendingCount(): Promise<number> {
  return getPendingSyncCount();
}

/**
 * Offline-aware write operation.
 * If online: writes directly to Supabase.
 * If offline: queues the operation for later sync.
 */
export async function offlineAwareWrite(
  table: string,
  operation: "INSERT" | "UPDATE" | "DELETE",
  recordId: string,
  payload: Record<string, unknown>,
): Promise<{ success: boolean; queued: boolean }> {
  // Try online first
  if (isOnline) {
    try {
      let error: any = null;
      if (operation === "INSERT") {
        const result = await supabase.from(table).insert(payload);
        error = result.error;
      } else if (operation === "UPDATE") {
        const result = await supabase.from(table).update(payload).eq("id", recordId);
        error = result.error;
      } else if (operation === "DELETE") {
        const result = await supabase.from(table).delete().eq("id", recordId);
        error = result.error;
      }

      if (!error) return { success: true, queued: false };
      // If network error, fall through to queue
    } catch {
      // Network error — queue it
    }
  }

  // Offline or failed — queue the operation
  await queueOperation(table, operation, recordId, payload);
  return { success: true, queued: true };
}
