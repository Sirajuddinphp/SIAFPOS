import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import type Database from "better-sqlite3";
import { getDatabase } from "./connection";
import { logger } from "../logger/logger";

export type MigrationStatus = {
  appliedCount: number;
  latestMigration: string | null;
};

export function runMigrations(db: Database.Database = getDatabase()): MigrationStatus {
  ensureMigrationTable(db);
  const migrationFiles = getMigrationFiles();

  for (const migrationFile of migrationFiles) {
    const alreadyApplied = db
      .prepare("SELECT 1 FROM migration_history WHERE migration_name = ?")
      .get(migrationFile.name);

    if (alreadyApplied) {
      continue;
    }

    const sql = fs.readFileSync(migrationFile.path, "utf8");
    const applyMigration = db.transaction(() => {
      db.exec(sql);
      db.prepare(
        "INSERT INTO migration_history (migration_name, batch_no, applied_at, checksum) VALUES (?, ?, ?, ?)"
      ).run(migrationFile.name, getNextBatchNo(db), new Date().toISOString(), checksum(sql));
    });

    try {
      applyMigration();
      logger.info("migration", "Migration applied", { migration: migrationFile.name });
    } catch (error) {
      logger.error("migration", "Migration failed", { migration: migrationFile.name, error });
      throw error;
    }
  }

  return getMigrationStatus(db);
}

export function getMigrationStatus(db: Database.Database = getDatabase()): MigrationStatus {
  ensureMigrationTable(db);
  const row = db
    .prepare("SELECT migration_name AS latestMigration FROM migration_history ORDER BY id DESC LIMIT 1")
    .get() as { latestMigration: string } | undefined;
  const count = db.prepare("SELECT COUNT(*) AS count FROM migration_history").get() as { count: number };

  return {
    appliedCount: count.count,
    latestMigration: row?.latestMigration ?? null
  };
}

function ensureMigrationTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migration_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      migration_name TEXT NOT NULL UNIQUE,
      batch_no INTEGER NOT NULL,
      applied_at TEXT NOT NULL,
      checksum TEXT NOT NULL
    );
  `);
}

function getNextBatchNo(db: Database.Database): number {
  const row = db.prepare("SELECT COALESCE(MAX(batch_no), 0) + 1 AS batchNo FROM migration_history").get() as {
    batchNo: number;
  };
  return row.batchNo;
}

function getMigrationFiles(): Array<{ name: string; path: string }> {
  const migrationsDir = resolveMigrationsDir();
  return fs
    .readdirSync(migrationsDir)
    .filter((fileName) => /^[0-9]+_.+\.sql$/.test(fileName))
    .sort()
    .map((fileName) => ({ name: fileName, path: path.join(migrationsDir, fileName) }));
}

function resolveMigrationsDir(): string {
  const electronAppAvailable =
    typeof app !== "undefined" &&
    app !== null &&
    typeof app.isPackaged === "boolean";

  const candidates = [
    path.join(process.cwd(), "electron", "database", "migrations"),

    electronAppAvailable &&
    app.isPackaged &&
    typeof process.resourcesPath === "string"
      ? path.join(process.resourcesPath, "migrations")
      : null,

    path.join(__dirname, "migrations")
  ].filter((candidate): candidate is string => Boolean(candidate));

  const migrationsDir = candidates.find((candidate) =>
    fs.existsSync(candidate)
  );

  if (!migrationsDir) {
    throw new Error("Migration directory not found.");
  }

  return migrationsDir;
}

function checksum(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return String(hash);
}
