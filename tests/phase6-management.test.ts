import { describe, expect, it } from "vitest";
import { CustomerService } from "../electron/services/customer-service";
import { ReportService } from "../electron/services/report-service";
import { createMigratedTestDatabase } from "./test-helpers";

describe("phase 6 management", () => {
  it("creates, updates and deactivates customers", () => {
    const db = createMigratedTestDatabase();
    const service = new CustomerService(db);
    const created = service.save({ name: "Asha Patel", phone: "9999999999", email: "asha@example.com" });
    expect(created.name).toBe("Asha Patel");
    const updated = service.save({ customerUuid: created.uuid, name: "Asha P", phone: "9999999999", isActive: true });
    expect(updated.name).toBe("Asha P");
    expect(service.setActive(created.uuid, false).isActive).toBe(false);
    db.close();
  });

  it("returns an empty sales report when there are no settled bills", () => {
    const db = createMigratedTestDatabase();
    const report = new ReportService(db).sales("2026-01-01T00:00:00.000Z", "2026-12-31T23:59:59.999Z");
    expect(report.summary.orderCount).toBe(0);
    expect(report.summary.netSalesMinor).toBe(0);
    expect(report.daily).toEqual([]);
    db.close();
  });
});
