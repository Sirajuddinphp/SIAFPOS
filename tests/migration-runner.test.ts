import { describe, expect, it, vi } from "vitest";
import { createMigratedTestDatabase } from "./test-helpers";

vi.mock("electron", () => ({
  app: {
    isPackaged: false,
    getPath: () => process.cwd(),
    getVersion: () => "0.1.0"
  }
}));

describe("migration runner", () => {
  it("applies numbered migrations and creates required tables", () => {
    const db = createMigratedTestDatabase();
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as Array<{ name: string }>;

    expect(tables.map((table) => table.name)).toContain("restaurants");
    expect(tables.map((table) => table.name)).toContain("audit_logs");
    expect(tables.map((table) => table.name)).toContain("categories");
    expect(tables.map((table) => table.name)).toContain("orders");
    expect(tables.map((table) => table.name)).toContain("kot_tickets");
    expect(tables.map((table) => table.name)).toContain("migration_history");
    expect(tables.map((table) => table.name)).toContain("printer_profiles");
    expect(tables.map((table) => table.name)).toContain("printer_routes");
    expect(db.prepare("SELECT COUNT(*) AS count FROM migration_history").get()).toEqual({ count: 14 });

    db.close();
  });
});
