import type Database from "better-sqlite3";
import { getDatabase } from "./connection";

export function runInTransaction<T>(work: (db: Database.Database) => T): T {
  const db = getDatabase();
  const transaction = db.transaction(() => work(db));
  return transaction();
}
