import { describe, expect, it } from "vitest";
import { PricingService } from "../electron/services/pricing-service";

describe("pricing service", () => {
  const service = new PricingService();

  it("computes exclusive GST totals", () => {
    const totals = service.computeOrderTotals(
      [{ unitPriceMinor: 10000, qty: 2, gstMode: "exclusive", gstRateBasisPoints: 500, modifierTotalMinor: 0 }],
      null
    );

    expect(totals.subtotalMinor).toBe(20000);
    expect(totals.taxMinor).toBe(1000);
    expect(totals.grandTotalMinor).toBe(21000);
  });

  it("computes inclusive GST totals", () => {
    const totals = service.computeOrderTotals(
      [{ unitPriceMinor: 10500, qty: 1, gstMode: "inclusive", gstRateBasisPoints: 500, modifierTotalMinor: 0 }],
      null
    );

    expect(totals.subtotalMinor).toBe(10500);
    expect(totals.taxableMinor).toBe(10000);
    expect(totals.taxMinor).toBe(500);
    expect(totals.grandTotalMinor).toBe(10500);
  });

  it("caps fixed discount at subtotal", () => {
    const totals = service.computeOrderTotals(
      [{ unitPriceMinor: 8000, qty: 1, gstMode: "exclusive", gstRateBasisPoints: 0, modifierTotalMinor: 0 }],
      { type: "fixed", value: 10000 }
    );

    expect(totals.discountMinor).toBe(8000);
    expect(totals.grandTotalMinor).toBe(0);
  });
});
