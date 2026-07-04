/**
 * ISyncEngine — domain interface for the offline-first sync orchestrator.
 * Concrete implementation lives in the mobile sync feature module.
 */

import type { Result } from "../types/result";
import type { SyncReport, SyncOperation, SyncStatus } from "../entities/sync";

export interface ISyncEngine {
  /**
   * Flush the local sync queue and pull server changes.
   * Returns a report summarising what was uploaded/downloaded.
   */
  sync(): Promise<Result<SyncReport>>;

  /**
   * Enqueue a local write/delete operation to be replayed against the server
   * once connectivity is available.
   */
  queueOperation(op: SyncOperation): Promise<void>;

  /** Returns the current sync status without triggering a sync. */
  getStatus(): SyncStatus;
}
