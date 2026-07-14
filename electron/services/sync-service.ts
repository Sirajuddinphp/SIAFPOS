import type Database from "better-sqlite3";
import type { ConfigureSyncInput, ProcessSyncResult, SyncStatus } from "../../shared/contracts/sync-contracts";

export class SyncError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
  }
}

type OutboxRow = {
  uuid: string;
  entity_type: string;
  entity_uuid: string;
  operation: "upsert" | "delete";
  payload_json: string;
  attempt_count: number;
};

export class SyncService {
  constructor(private readonly db: Database.Database) {}

  getStatus(): SyncStatus {
    const apiUrl = this.getSetting("sync.api_url");
    const counts = this.db.prepare(`
      SELECT
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pendingCount,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failedCount,
        SUM(CASE WHEN status = 'conflict' THEN 1 ELSE 0 END) AS conflictCount
      FROM sync_outbox
    `).get() as { pendingCount: number | null; failedCount: number | null; conflictCount: number | null };
    const state = this.db.prepare("SELECT * FROM sync_state WHERE id = 1").get() as {
      last_push_at: string | null;
      last_pull_at: string | null;
      last_error: string | null;
    };

    return {
      configured: Boolean(apiUrl),
      apiUrl,
      pendingCount: counts.pendingCount ?? 0,
      failedCount: counts.failedCount ?? 0,
      conflictCount: counts.conflictCount ?? 0,
      lastPushAt: state.last_push_at,
      lastPullAt: state.last_pull_at,
      lastError: state.last_error
    };
  }

  configure(input: ConfigureSyncInput): SyncStatus {
    const now = new Date().toISOString();
    const save = this.db.prepare(`
      INSERT INTO app_settings (setting_key, setting_value, setting_type, is_secure, updated_at)
      VALUES (?, ?, 'string', ?, ?)
      ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value, is_secure = excluded.is_secure, updated_at = excluded.updated_at
    `);
    const transaction = this.db.transaction(() => {
      save.run("sync.api_url", input.apiUrl.replace(/\/$/, ""), 0, now);
      if (input.apiToken !== undefined) {
        save.run("sync.api_token", input.apiToken, 1, now);
      }
    });
    transaction();
    return this.getStatus();
  }

  async process(limit = 50): Promise<ProcessSyncResult> {
    const apiUrl = this.getSetting("sync.api_url");
    if (!apiUrl) {
      return { attempted: 0, synced: 0, failed: 0, skipped: true, message: "Cloud API is not configured." };
    }

    const token = this.getSetting("sync.api_token");
    const rows = this.db.prepare(`
      SELECT uuid, entity_type, entity_uuid, operation, payload_json, attempt_count
      FROM sync_outbox
      WHERE status IN ('pending','failed')
        AND (next_attempt_at IS NULL OR next_attempt_at <= ?)
      ORDER BY id
      LIMIT ?
    `).all(new Date().toISOString(), limit) as OutboxRow[];

    if (rows.length === 0) {
      return { attempted: 0, synced: 0, failed: 0, skipped: false };
    }

    const now = new Date().toISOString();
    this.db.prepare(`UPDATE sync_outbox SET status = 'syncing', updated_at = ? WHERE uuid IN (${rows.map(() => "?").join(",")})`)
      .run(now, ...rows.map((row) => row.uuid));

    try {
      const response = await fetch(`${apiUrl}/api/pos/sync/push`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          events: rows.map((row) => ({
            eventUuid: row.uuid,
            entityType: row.entity_type,
            entityUuid: row.entity_uuid,
            operation: row.operation,
            payload: JSON.parse(row.payload_json)
          }))
        })
      });

      if (!response.ok) {
        throw new SyncError("SYNC_HTTP_ERROR", `Cloud sync returned HTTP ${response.status}.`);
      }

      const result = await response.json().catch(() => ({})) as { conflicts?: string[] };
      const conflicts = new Set(result.conflicts ?? []);
      const complete = this.db.transaction(() => {
        const synced = this.db.prepare("UPDATE sync_outbox SET status = 'synced', synced_at = ?, updated_at = ?, last_error = NULL WHERE uuid = ?");
        const conflict = this.db.prepare("UPDATE sync_outbox SET status = 'conflict', updated_at = ?, last_error = 'Cloud conflict' WHERE uuid = ?");
        for (const row of rows) {
          if (conflicts.has(row.uuid)) conflict.run(now, row.uuid);
          else synced.run(now, now, row.uuid);
        }
        this.db.prepare("UPDATE sync_state SET last_push_at = ?, last_error = NULL, updated_at = ? WHERE id = 1").run(now, now);
      });
      complete();
      return { attempted: rows.length, synced: rows.length - conflicts.size, failed: 0, skipped: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown sync error";
      const failedAt = new Date().toISOString();
      const failRows = this.db.transaction(() => {
        const statement = this.db.prepare(`
          UPDATE sync_outbox
          SET status = 'failed', attempt_count = attempt_count + 1, last_error = ?,
              next_attempt_at = ?, updated_at = ?
          WHERE uuid = ?
        `);
        for (const row of rows) {
          const delayMinutes = Math.min(60, 2 ** Math.min(row.attempt_count + 1, 6));
          const nextAttempt = new Date(Date.now() + delayMinutes * 60_000).toISOString();
          statement.run(message, nextAttempt, failedAt, row.uuid);
        }
        this.db.prepare("UPDATE sync_state SET last_error = ?, updated_at = ? WHERE id = 1").run(message, failedAt);
      });
      failRows();
      return { attempted: rows.length, synced: 0, failed: rows.length, skipped: false, message };
    }
  }

  retryFailed(): SyncStatus {
    this.db.prepare("UPDATE sync_outbox SET status = 'pending', next_attempt_at = NULL, last_error = NULL, updated_at = ? WHERE status = 'failed'")
      .run(new Date().toISOString());
    return this.getStatus();
  }

  private getSetting(key: string): string | null {
    const row = this.db.prepare("SELECT setting_value FROM app_settings WHERE setting_key = ?").get(key) as { setting_value: string } | undefined;
    return row?.setting_value ?? null;
  }
}
