import { describe, expect, it, vi } from "vitest";
import { createMigratedTestDatabase, seedAuthFixture, seedPhase2Fixture } from "./test-helpers";
import { OrderService } from "../electron/services/order-service";
import { KotService } from "../electron/services/kot-service";

vi.mock("electron", () => ({ app: { isPackaged: false, getPath: () => process.cwd(), getVersion: () => "0.1.0" } }));

describe("phase 9 KDS", () => {
  it("tracks kitchen timestamps and priority", () => {
    const db = createMigratedTestDatabase();
    const { user, terminal } = seedAuthFixture(db);
    seedPhase2Fixture(db);
    const orderService = new OrderService(db);
    const order = orderService.createDraft("takeaway", { userUuid: user.uuid, terminalUuid: terminal.uuid });
    const product = db.prepare("SELECT uuid FROM products LIMIT 1").get() as { uuid: string };
    orderService.addItem({ orderUuid: order.uuid, productUuid: product.uuid });
    const service = new KotService(db);
    let kot = service.create(order.uuid, user.uuid);
    kot = service.setPriority(kot.uuid, 2);
    expect(kot.priority).toBe(2);
    kot = service.markStarted(kot.uuid, user.uuid);
    expect(kot.startedAt).toBeTruthy();
    kot = service.markReady(kot.uuid, user.uuid);
    expect(kot.readyAt).toBeTruthy();
    kot = service.markCompleted(kot.uuid, user.uuid);
    expect(kot.completedAt).toBeTruthy();
    db.close();
  });
});
