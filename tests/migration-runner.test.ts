import { describe, expect, it } from "vitest";
import { createMigratedTestDatabase } from "./test-helpers";

describe("migration runner", () => {
  it("applies numbered migrations and creates required tables", () => {
    const db = createMigratedTestDatabase();
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as Array<{ name: string }>;

    const tableNames = tables.map((table) => table.name);
    expect(tableNames).toContain("restaurants");
    expect(tableNames).toContain("audit_logs");
    expect(tableNames).toContain("categories");
    expect(tableNames).toContain("orders");
    expect(tableNames).toContain("kot_tickets");
    expect(tableNames).toContain("migration_history");
    expect(tableNames).toContain("stock_transfers");
    expect(tableNames).toContain("finance_accounts");
    expect(tableNames).toContain("enterprise_license");
    expect(tableNames).toContain("enterprise_devices");
    expect(tableNames).toContain("enterprise_api_keys");
    expect(tableNames).toContain("enterprise_backups");

    expect(
      db.prepare("SELECT COUNT(*) AS count FROM migration_history").get()
    ).toEqual({ count: 25 });

    const kotColumns = db.prepare("PRAGMA table_info(kot_tickets)").all() as Array<{ name: string }>;
    const kotColumnNames = kotColumns.map((column) => column.name);
    expect(kotColumnNames).toContain("kitchen_station");
    expect(kotColumnNames).toContain("priority");
    expect(kotColumnNames).toContain("started_at");
    expect(kotColumnNames).toContain("ready_at");
    expect(kotColumnNames).toContain("completed_at");

    db.close();
  });
});
