import { describe, expect, it, vi } from "vitest";
import { KotService } from "../electron/services/kot-service";
import { OrderService } from "../electron/services/order-service";
import { createMigratedTestDatabase, seedAuthFixture, seedPhase2Fixture } from "./test-helpers";

vi.mock("electron", () => ({
  app: {
    isPackaged: false,
    getPath: () => process.cwd(),
    getVersion: () => "0.1.0"
  }
}));

describe("kot service", () => {
  it("creates a full KOT on first send", () => {
    const db = createMigratedTestDatabase();
    const fixture = seedAuthFixture(db);
    seedPhase2Fixture(db);
    const orders = new OrderService(db);
    const kot = new KotService(db);

    const order = orders.createDraft("takeaway", { userUuid: fixture.user.uuid, terminalUuid: fixture.terminal.uuid });
    const product = db.prepare("SELECT uuid FROM products ORDER BY id LIMIT 1").get() as { uuid: string };
    const updated = orders.addItem({ orderUuid: order.uuid, productUuid: product.uuid });
    const ticket = kot.create(updated.uuid, fixture.user.uuid);

    expect(ticket.kind).toBe("full");
    expect(ticket.items).toHaveLength(1);
    expect(ticket.items[0]?.lineAction).toBe("add");
    db.close();
  });

  it("creates qty add and cancel deltas", () => {
    const db = createMigratedTestDatabase();
    const fixture = seedAuthFixture(db);
    seedPhase2Fixture(db);
    const orders = new OrderService(db);
    const kot = new KotService(db);

    let order = orders.createDraft("takeaway", { userUuid: fixture.user.uuid, terminalUuid: fixture.terminal.uuid });
    const product = db.prepare("SELECT uuid FROM products ORDER BY id LIMIT 1").get() as { uuid: string };
    order = orders.addItem({ orderUuid: order.uuid, productUuid: product.uuid });
    kot.create(order.uuid, fixture.user.uuid);

    order = orders.updateItemQuantity({ orderUuid: order.uuid, orderItemUuid: order.items[0]!.uuid, quantity: 3 });
    let delta = kot.create(order.uuid, fixture.user.uuid);
    expect(delta.kind).toBe("delta");
    expect(delta.items[0]?.lineAction).toBe("add");
    expect(delta.items[0]?.qty).toBe(2);

    order = orders.updateItemQuantity({ orderUuid: order.uuid, orderItemUuid: order.items[0]!.uuid, quantity: 1 });
    delta = kot.create(order.uuid, fixture.user.uuid);
    expect(delta.items[0]?.lineAction).toBe("cancel");
    expect(delta.items[0]?.qty).toBe(2);
    db.close();
  });

  it("creates update delta for note changes", () => {
    const db = createMigratedTestDatabase();
    const fixture = seedAuthFixture(db);
    seedPhase2Fixture(db);
    const orders = new OrderService(db);
    const kot = new KotService(db);

    let order = orders.createDraft("takeaway", { userUuid: fixture.user.uuid, terminalUuid: fixture.terminal.uuid });
    const product = db.prepare("SELECT uuid FROM products ORDER BY id LIMIT 1").get() as { uuid: string };
    order = orders.addItem({ orderUuid: order.uuid, productUuid: product.uuid });
    kot.create(order.uuid, fixture.user.uuid);

    order = orders.setItemNote({ orderUuid: order.uuid, orderItemUuid: order.items[0]!.uuid, kitchenNote: "Less spicy" });
    const delta = kot.create(order.uuid, fixture.user.uuid);

    expect(delta.items.some((item) => item.lineAction === "update")).toBe(true);
    db.close();
  });

  it("creates cancel plus add on variant and modifier changes", () => {
    const db = createMigratedTestDatabase();
    const fixture = seedAuthFixture(db);
    seedPhase2Fixture(db);
    const orders = new OrderService(db);
    const kot = new KotService(db);

    let order = orders.createDraft("takeaway", { userUuid: fixture.user.uuid, terminalUuid: fixture.terminal.uuid });
    const product = db.prepare("SELECT uuid FROM products WHERE sku = 'PRD-PBM'").get() as { uuid: string };
    order = orders.addItem({ orderUuid: order.uuid, productUuid: product.uuid });
    kot.create(order.uuid, fixture.user.uuid);

    const variant = order.items[0]!.availableVariants.find((entry) => !entry.isDefault)!;
    order = orders.setItemVariant({ orderUuid: order.uuid, orderItemUuid: order.items[0]!.uuid, variantUuid: variant.uuid });
    let delta = kot.create(order.uuid, fixture.user.uuid);
    expect(delta.items.map((item) => item.lineAction)).toEqual(["cancel", "add"]);

    const modifier = order.items[0]!.availableModifierGroups[0]!.modifiers[0]!;
    order = orders.setItemModifiers({ orderUuid: order.uuid, orderItemUuid: order.items[0]!.uuid, modifierUuids: [modifier.uuid] });
    delta = kot.create(order.uuid, fixture.user.uuid);
    expect(delta.items.map((item) => item.lineAction)).toEqual(["cancel", "add"]);
    db.close();
  });

  it("rejects no-op sends, supports cancel, transitions, and reprint", () => {
    const db = createMigratedTestDatabase();
    const fixture = seedAuthFixture(db);
    seedPhase2Fixture(db);
    const orders = new OrderService(db);
    const kot = new KotService(db);

    let order = orders.createDraft("takeaway", { userUuid: fixture.user.uuid, terminalUuid: fixture.terminal.uuid });
    const product = db.prepare("SELECT uuid FROM products ORDER BY id LIMIT 1").get() as { uuid: string };
    order = orders.addItem({ orderUuid: order.uuid, productUuid: product.uuid });

    const first = kot.create(order.uuid, fixture.user.uuid);
    expect(() => kot.create(order.uuid, fixture.user.uuid)).toThrowError(/kitchen changes/i);

    const cancelled = kot.cancel(first.uuid, fixture.user.uuid, "Mistake");
    expect(cancelled.kind).toBe("cancel");

    order = orders.addItem({ orderUuid: order.uuid, productUuid: product.uuid });
    const active = kot.create(order.uuid, fixture.user.uuid);
    const started = kot.markStarted(active.uuid, fixture.user.uuid);
    const ready = kot.markReady(active.uuid, fixture.user.uuid);
    const completed = kot.markCompleted(active.uuid, fixture.user.uuid);
    const reprint = kot.reprint(completed.uuid, fixture.user.uuid);

    expect(started.status).toBe("preparing");
    expect(ready.status).toBe("ready");
    expect(completed.status).toBe("completed");
    expect(reprint.kind).toBe("reprint");
    expect(reprint.status).toBe("completed");
    db.close();
  });
});
