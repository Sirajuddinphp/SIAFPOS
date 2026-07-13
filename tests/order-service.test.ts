import { describe, expect, it, vi } from "vitest";
import { OrderService } from "../electron/services/order-service";
import { createMigratedTestDatabase, seedAuthFixture, seedPhase2Fixture } from "./test-helpers";

vi.mock("electron", () => ({
  app: {
    isPackaged: false,
    getPath: () => process.cwd(),
    getVersion: () => "0.1.0"
  }
}));

describe("order service", () => {
  it("creates a draft, adds items, and computes totals", () => {
    const db = createMigratedTestDatabase();
    const fixture = seedAuthFixture(db);
    seedPhase2Fixture(db);
    const service = new OrderService(db);

    const draft = service.createDraft("takeaway", {
      userUuid: fixture.user.uuid,
      terminalUuid: fixture.terminal.uuid
    });

    const product = db.prepare("SELECT uuid FROM products ORDER BY id LIMIT 1").get() as { uuid: string };
    const updated = service.addItem({ orderUuid: draft.uuid, productUuid: product.uuid });

    expect(updated.items).toHaveLength(1);
    expect(updated.status).toBe("active");
    expect(updated.totals.grandTotalMinor).toBeGreaterThan(0);

    db.close();
  });

  it("holds and recalls a dine-in order with table and waiter", () => {
    const db = createMigratedTestDatabase();
    const fixture = seedAuthFixture(db);
    seedPhase2Fixture(db);
    const service = new OrderService(db);

    let draft = service.createDraft("dine_in", {
      userUuid: fixture.user.uuid,
      terminalUuid: fixture.terminal.uuid
    });
    const product = db.prepare("SELECT uuid FROM products ORDER BY id LIMIT 1").get() as { uuid: string };
    const table = db.prepare("SELECT uuid FROM tables ORDER BY id LIMIT 1").get() as { uuid: string };
    const waiter = db.prepare("SELECT uuid FROM waiters ORDER BY id LIMIT 1").get() as { uuid: string };

    draft = service.addItem({ orderUuid: draft.uuid, productUuid: product.uuid });
    draft = service.setTable({ orderUuid: draft.uuid, tableUuid: table.uuid });
    draft = service.setWaiter({ orderUuid: draft.uuid, waiterUuid: waiter.uuid });
    const held = service.hold(draft.uuid, fixture.user.uuid);
    const recalled = service.recall(draft.uuid);

    expect(held.status).toBe("held");
    expect(recalled.status).toBe("active");
    expect(service.listHeld()).toHaveLength(0);

    db.close();
  });
});
