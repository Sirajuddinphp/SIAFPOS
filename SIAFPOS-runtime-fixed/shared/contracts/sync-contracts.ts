export type SyncQueueStatus = "pending" | "syncing" | "synced" | "failed" | "conflict";

export type SyncStatus = {
  configured: boolean;
  apiUrl: string | null;
  pendingCount: number;
  failedCount: number;
  conflictCount: number;
  lastPushAt: string | null;
  lastPullAt: string | null;
  lastError: string | null;
};

export type ConfigureSyncInput = {
  apiUrl: string;
  apiToken?: string;
};

export type ProcessSyncResult = {
  attempted: number;
  synced: number;
  failed: number;
  skipped: boolean;
  message?: string;
};
