import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { app } from "electron";
import { logger } from "../logger/logger";

let database: Database.Database | null = null;
let databasePath: string | null = null;

export type DatabaseInitOptions = {
  databasePath?: string;
};

export function initializeDatabase(options: DatabaseInitOptions = {}): Database.Database {
  if (database) {
    return database;
  }

  const resolvedPath = options.databasePath ?? path.join(app.getPath("userData"), "mealhi5-pos.sqlite");
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

  database = new Database(resolvedPath);
  databasePath = resolvedPath;

  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");
  database.pragma("synchronous = NORMAL");

  logger.info("database", "SQLite database opened", { databasePath: resolvedPath });
  return database;
}

export function getDatabase(): Database.Database {
  if (!database) {
    throw new Error("Database has not been initialized.");
  }

  return database;
}

export function getDatabasePath(): string | null {
  return databasePath;
}

export function closeDatabase(): void {
  if (database) {
    database.close();
    database = null;
    databasePath = null;
    logger.info("database", "SQLite database closed");
  }
}

export function isDatabaseOpen(): boolean {
  return database !== null;
}
