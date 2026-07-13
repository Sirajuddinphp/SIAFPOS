import Database from "better-sqlite3";
import { runMigrations } from "../electron/database/migration-runner";
import { seedDevelopmentData } from "../electron/database/seeders/development-seeder";
import { RestaurantRepository } from "../electron/repositories/restaurant-repository";
import { OutletRepository } from "../electron/repositories/outlet-repository";
import { TerminalRepository } from "../electron/repositories/terminal-repository";
import { UserRepository } from "../electron/repositories/user-repository";
import { hashPassword, hashPin } from "../electron/security/password";

export function createMigratedTestDatabase(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  db.pragma("synchronous = NORMAL");
  runMigrations(db);
  return db;
}

export function seedAuthFixture(db: Database.Database) {
  const now = new Date().toISOString();
  const restaurant = new RestaurantRepository(db).createDemoRestaurant(now);
  const outlet = new OutletRepository(db).createDemoOutlet(restaurant.uuid, now);
  const terminal = new TerminalRepository(db).createDemoTerminal(restaurant.uuid, outlet.uuid, "0.1.0", now);
  const user = new UserRepository(db).createDemoManager(
    restaurant.uuid,
    outlet.uuid,
    hashPassword("admin123"),
    hashPin("1234"),
    now
  );

  return { restaurant, outlet, terminal, user };
}

export function seedPhase2Fixture(db: Database.Database) {
  seedDevelopmentData(db);
}
