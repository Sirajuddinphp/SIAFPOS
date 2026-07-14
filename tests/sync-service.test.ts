import { describe, expect, it, vi } from "vitest";
import { SyncService } from "../electron/services/sync-service";
import {createMigratedTestDatabase,seedAuthFixture} from "./test-helpers";

vi.mock("electron", () => ({ app: { isPackaged: false, getPath: () => process.cwd(), getVersion: () => "0.1.0" } }));

describe("sync service", () => {
  it("reports unconfigured state and tracks outbox events", () => {
    const db = createMigratedTestDatabase();
    const { restaurant, outlet, terminal, user } = seedAuthFixture(db);

    const service = new SyncService(db);

    expect(service.getStatus().configured).toBe(false);

    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO orders (
        uuid,
        order_no,
        order_type,
        status,
        discount_amount_minor,
        subtotal_minor,
        taxable_minor,
        tax_minor,
        grand_total_minor,
        opened_at,
        updated_at,
        created_by_user_uuid,
        terminal_uuid
      )
      VALUES (?, ?, ?, ?, 0, 0, 0, 0, 0, ?, ?, ?, ?)
    `).run(
      "sync-order",
      "SYNC-1",
      "takeaway",
      "draft",
      now,
      now,
      user.uuid,
      terminal.uuid
    );

    const status = service.getStatus();

    expect(status.pendingCount).toBeGreaterThan(0);
    expect(restaurant.uuid).toBeTruthy();
    expect(outlet.uuid).toBeTruthy();

    db.close();
  });

  it("skips processing until configured", async () => {
    const db = createMigratedTestDatabase();
    const result = await new SyncService(db).process();
    expect(result.skipped).toBe(true);
    db.close();
  });
});
