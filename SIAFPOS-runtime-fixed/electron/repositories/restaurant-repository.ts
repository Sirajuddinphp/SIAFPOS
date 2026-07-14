import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";

export type RestaurantRecord = {
  uuid: string;
  name: string;
  code: string;
  legal_name: string | null;
  phone: string | null;
  email: string | null;
  gst_number: string | null;
  currency_code: string;
  timezone: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
};

export class RestaurantRepository {
  constructor(private readonly db: Database.Database) {}

  count(): number {
    const row = this.db.prepare("SELECT COUNT(*) AS count FROM restaurants").get() as { count: number };
    return row.count;
  }

  findByCode(code: string): RestaurantRecord | null {
    return (
      (this.db.prepare("SELECT * FROM restaurants WHERE code = ?").get(code) as RestaurantRecord | undefined) ?? null
    );
  }

  createDemoRestaurant(now: string): RestaurantRecord {
    const uuid = randomUUID();
    this.db
      .prepare(
        `INSERT INTO restaurants (
          uuid, name, code, legal_name, phone, email, gst_number, currency_code, timezone, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        uuid,
        "MealHi5 Demo Restaurant",
        "MH5-DEMO",
        "MealHi5 Demo Restaurant",
        null,
        null,
        null,
        "INR",
        "Asia/Kolkata",
        "active",
        now,
        now
      );

    const created = this.findByCode("MH5-DEMO");
    if (!created) {
      throw new Error("Demo restaurant seed failed.");
    }
    return created;
  }
}
