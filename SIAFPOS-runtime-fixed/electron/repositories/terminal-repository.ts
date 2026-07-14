import { randomUUID } from "node:crypto";
import os from "node:os";
import type Database from "better-sqlite3";

export type TerminalRecord = {
  uuid: string;
  restaurant_uuid: string;
  outlet_uuid: string;
  name: string;
  code: string;
  device_identifier: string;
  app_version: string;
  last_active_at: string | null;
  registration_status: "registered" | "pending" | "disabled";
  created_at: string;
  updated_at: string;
};

export class TerminalRepository {
  constructor(private readonly db: Database.Database) {}

  findByOutletAndCode(outletUuid: string, code: string): TerminalRecord | null {
    return (
      (this.db
        .prepare("SELECT * FROM terminals WHERE outlet_uuid = ? AND code = ?")
        .get(outletUuid, code) as TerminalRecord | undefined) ?? null
    );
  }

  findFirst(): TerminalRecord | null {
    return (this.db.prepare("SELECT * FROM terminals ORDER BY id LIMIT 1").get() as TerminalRecord | undefined) ?? null;
  }

  touch(uuid: string, now: string): void {
    this.db.prepare("UPDATE terminals SET last_active_at = ?, updated_at = ? WHERE uuid = ?").run(now, now, uuid);
  }

  createDemoTerminal(restaurantUuid: string, outletUuid: string, appVersion: string, now: string): TerminalRecord {
    const uuid = randomUUID();
    this.db
      .prepare(
        `INSERT INTO terminals (
          uuid, restaurant_uuid, outlet_uuid, name, code, device_identifier, app_version,
          last_active_at, registration_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        uuid,
        restaurantUuid,
        outletUuid,
        "Counter 1",
        "POS-01",
        `${os.hostname()}-${os.platform()}`,
        appVersion,
        now,
        "registered",
        now,
        now
      );

    const created = this.findByOutletAndCode(outletUuid, "POS-01");
    if (!created) {
      throw new Error("Demo terminal seed failed.");
    }
    return created;
  }
}
