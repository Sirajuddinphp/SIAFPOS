import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type { UserRole } from "../../shared/contracts/auth-contracts";

export type UserRecord = {
  uuid: string;
  restaurant_uuid: string;
  outlet_uuid: string;
  name: string;
  username: string;
  password_hash: string;
  pin_hash: string;
  role: UserRole;
  status: "active" | "inactive";
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export class UserRepository {
  constructor(private readonly db: Database.Database) {}

  findByUsername(restaurantUuid: string, username: string): UserRecord | null {
    return (
      (this.db
        .prepare("SELECT * FROM users WHERE restaurant_uuid = ? AND username = ?")
        .get(restaurantUuid, username) as UserRecord | undefined) ?? null
    );
  }

  findActiveUsersByOutlet(outletUuid: string): UserRecord[] {
    return this.db
      .prepare("SELECT * FROM users WHERE outlet_uuid = ? AND status = 'active'")
      .all(outletUuid) as UserRecord[];
  }

  updateLastLogin(userUuid: string, now: string): void {
    this.db.prepare("UPDATE users SET last_login_at = ?, updated_at = ? WHERE uuid = ?").run(now, now, userUuid);
  }

  createDemoManager(
    restaurantUuid: string,
    outletUuid: string,
    passwordHash: string,
    pinHash: string,
    now: string
  ): UserRecord {
    const uuid = randomUUID();
    this.db
      .prepare(
        `INSERT INTO users (
          uuid, restaurant_uuid, outlet_uuid, name, username, password_hash, pin_hash, role, status,
          last_login_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        uuid,
        restaurantUuid,
        outletUuid,
        "Demo Manager",
        "admin",
        passwordHash,
        pinHash,
        "manager",
        "active",
        null,
        now,
        now
      );

    const created = this.findByUsername(restaurantUuid, "admin");
    if (!created) {
      throw new Error("Demo user seed failed.");
    }
    return created;
  }
}
