/**
 * Offline Sync Module
 * 
 * Stores pending changes locally when offline, then syncs to Supabase when back online.
 * Uses expo-sqlite for the queue and NetInfo for connectivity detection.
 */

import * as SQLite from "expo-sqlite";
import { supabase } from "@core/network";

const DB_NAME = "fpl4flight_sync.db";

interface SyncQueueItem {
  id: number;
  table_name: string;
  operation: "INSERT" | "UPDATE" | "DELETE";
  record_id: string;
  payload: string;
  created_at: string;
  synced: number;
  retry_count: number;
}

const MAX_RETRIES = 5;

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        operation TEXT NOT NULL,
        record_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0,
        retry_count INTEGER DEFAULT 0
      );
    `);
    // Add retry_count column if upgrading from old schema
    try { await db.execAsync("ALTER TABLE sync_queue ADD COLUMN retry_count INTEGER DEFAULT 0;"); } catch { /* column already exists */ }
  }
  return db;
}

/** Add an operation to the sync queue (called when offline) */
export async function queueOperation(
  tableName: string,
  operation: "INSERT" | "UPDATE" | "DELETE",
  recordId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    "INSERT INTO sync_queue (table_name, operation, record_id, payload) VALUES (?, ?, ?, ?)",
    [tableName, operation, recordId, JSON.stringify(payload)],
  );
}

/** Get all pending (unsynced) operations that haven't exceeded retry limit */
export async function getPendingOperations(): Promise<SyncQueueItem[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<SyncQueueItem>(
    "SELECT * FROM sync_queue WHERE synced = 0 AND retry_count < ? ORDER BY created_at ASC",
    [MAX_RETRIES],
  );
  return rows;
}

/** Process the sync queue — push all pending changes to Supabase */
export async function processSyncQueue(): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingOperations();
  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      const payload = JSON.parse(item.payload);
      let opError: { message: string } | null = null;

      if (item.operation === "INSERT") {
        const { error } = await supabase.from(item.table_name).insert(payload);
        opError = error;
      } else if (item.operation === "UPDATE") {
        const { error } = await supabase.from(item.table_name).update(payload).eq("id", item.record_id);
        opError = error;
      } else if (item.operation === "DELETE") {
        const { error } = await supabase.from(item.table_name).delete().eq("id", item.record_id);
        opError = error;
      }

      const database = await getDb();
      if (opError) {
        // Increment retry count
        await database.runAsync("UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?", [item.id]);
        if (__DEV__) console.log(`[Sync] Item ${item.id} failed (retry ${item.retry_count + 1}/${MAX_RETRIES}):`, opError.message);
        failed++;
        continue;
      }

      // Mark as synced
      await database.runAsync("UPDATE sync_queue SET synced = 1 WHERE id = ?", [item.id]);
      synced++;
    } catch {
      // Increment retry count on unexpected errors too
      const database = await getDb();
      await database.runAsync("UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?", [item.id]).catch(() => {});
      failed++;
    }
  }

  return { synced, failed };
}

/** Clear all synced items from the queue */
export async function clearSyncedItems(): Promise<void> {
  const database = await getDb();
  await database.runAsync("DELETE FROM sync_queue WHERE synced = 1");
}

/** Check if there are pending operations */
export async function hasPendingSync(): Promise<boolean> {
  const pending = await getPendingOperations();
  return pending.length > 0;
}

/** Get count of pending operations */
export async function getPendingSyncCount(): Promise<number> {
  const database = await getDb();
  const result = await database.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM sync_queue WHERE synced = 0");
  return result?.count ?? 0;
}
