import type Database from "better-sqlite3";
import type { DatabaseHealth } from "../../shared/contracts/system-contracts";
import { getDatabasePath } from "../database/connection";
import { getMigrationStatus } from "../database/migration-runner";

const requiredTables = [
  "restaurants",
  "outlets",
  "terminals",
  "users",
  "app_settings",
  "staff_sessions",
  "audit_logs",
  "migration_history"
];

export class DatabaseHealthService {
  constructor(private readonly db: Database.Database) {}

  getHealth(): DatabaseHealth {
    const walMode = this.db.pragma("journal_mode", { simple: true }) as string;
    const foreignKeys = this.db.pragma("foreign_keys", { simple: true }) as number;
    const busyTimeout = this.db.pragma("busy_timeout", { simple: true }) as number;
    const tablesPresent = this.requiredTablesPresent();

    const connectionOpen = this.db.open;

    return {
      status: connectionOpen && tablesPresent ? "ok" : "error",
      databasePathAvailable: Boolean(getDatabasePath()),
      connectionOpen,
      walEnabled: walMode.toLowerCase() === "wal",
      foreignKeysEnabled: foreignKeys === 1,
      busyTimeoutMs: busyTimeout,
      requiredTablesPresent: tablesPresent,
      message: tablesPresent ? "SQLite database is ready." : "SQLite database is missing required tables.",
      checkedAt: new Date().toISOString()
    };
  }

  getVersion() {
    return getMigrationStatus(this.db);
  }

  private requiredTablesPresent(): boolean {
    const existing = this.db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as Array<{ name: string }>;
    const tableNames = new Set(existing.map((row) => row.name));
    return requiredTables.every((tableName) => tableNames.has(tableName));
  }
}
