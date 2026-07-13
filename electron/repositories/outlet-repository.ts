import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";

export type OutletRecord = {
  uuid: string;
  restaurant_uuid: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  phone: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
};

export class OutletRepository {
  constructor(private readonly db: Database.Database) {}

  findByRestaurantAndCode(restaurantUuid: string, code: string): OutletRecord | null {
    return (
      (this.db
        .prepare("SELECT * FROM outlets WHERE restaurant_uuid = ? AND code = ?")
        .get(restaurantUuid, code) as OutletRecord | undefined) ?? null
    );
  }

  createDemoOutlet(restaurantUuid: string, now: string): OutletRecord {
    const uuid = randomUUID();
    this.db
      .prepare(
        `INSERT INTO outlets (
          uuid, restaurant_uuid, name, code, address, city, state, postal_code, phone, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(uuid, restaurantUuid, "Main Outlet", "MAIN", null, null, null, null, null, "active", now, now);

    const created = this.findByRestaurantAndCode(restaurantUuid, "MAIN");
    if (!created) {
      throw new Error("Demo outlet seed failed.");
    }
    return created;
  }
}
