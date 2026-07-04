/**
 * Sync-related domain types — used by ISyncEngine.
 * Framework agnostic, no external dependencies.
 */

export interface SyncReport {
  /** Number of local operations uploaded to the server */
  uploaded: number;
  /** Number of server changes downloaded to the local store */
  downloaded: number;
  /** Number of conflicts resolved automatically */
  conflictsResolved: number;
  /** Number of conflicts that require manual user resolution */
  conflictsPending: number;
  /** ISO timestamp when the sync completed */
  completedAt: Date;
}

export type SyncOperationType = "create" | "update" | "delete";

export interface SyncOperation {
  /** Unique identifier for this queued operation */
  id: string;
  type: SyncOperationType;
  /** The resource being operated on (e.g. "form_instance") */
  resource: string;
  /** The ID of the resource being operated on */
  resourceId: string;
  /** The full payload to send to the server */
  payload: Record<string, unknown>;
  /** Number of times this operation has been retried */
  retryCount: number;
  createdAt: Date;
}

export type SyncStatusState =
  | "idle"
  | "syncing"
  | "error"
  | "offline"
  | "conflict";

export interface SyncStatus {
  state: SyncStatusState;
  /** Number of operations waiting to be sent to the server */
  pendingCount: number;
  /** ISO timestamp of the most recent successful sync, or null if never synced */
  lastSyncedAt: Date | null;
  /** The most recent error message, if state === 'error' */
  lastError: string | null;
}
