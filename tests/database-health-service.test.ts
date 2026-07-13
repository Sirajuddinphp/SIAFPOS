import { describe, expect, it, vi } from "vitest";
import { DatabaseHealthService } from "../electron/services/database-health-service";
import { createMigratedTestDatabase } from "./test-helpers";

vi.mock("electron", () => ({
  app: {
    isPackaged: false,
    getPath: () => process.cwd(),
    getVersion: () => "0.1.0"
  }
}));

describe("database health service", () => {
  it("reports healthy database after migrations", () => {
    const db = createMigratedTestDatabase();
    const health = new DatabaseHealthService(db).getHealth();

    expect(health.requiredTablesPresent).toBe(true);
    expect(health.foreignKeysEnabled).toBe(true);
    expect(health.status).toBe("ok");

    db.close();
  });
});
