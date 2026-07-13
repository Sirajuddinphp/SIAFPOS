import type { AppliedDiscount, OrderItemDraft, OrderTotals } from "../../shared/contracts/order-contracts";
import { allocateDiscount, computeDiscountAmount, computeLineTotals } from "../../shared/money/pos-money";

type PricingLine = {
  unitPriceMinor: number;
  qty: number;
  gstMode: "inclusive" | "exclusive";
  gstRateBasisPoints: number;
  modifierTotalMinor: number;
};

export class PricingService {
  computeOrderItems(
    lines: PricingLine[],
    appliedDiscount: Pick<AppliedDiscount, "type" | "value"> | null
  ): Array<Pick<OrderItemDraft, "lineSubtotalMinor" | "lineDiscountMinor" | "lineTaxMinor" | "lineGrandTotalMinor">> {
    const lineSubtotals = lines.map((line) =>
      computeLineTotals(line.unitPriceMinor, line.qty, line.gstMode, line.gstRateBasisPoints, line.modifierTotalMinor).subtotalMinor
    );
    const discountMinor = appliedDiscount ? computeDiscountAmount(lineSubtotals.reduce((sum, value) => sum + value, 0), appliedDiscount.type, appliedDiscount.value) : 0;
    const allocations = allocateDiscount(lineSubtotals, discountMinor);

    return lines.map((line, index) => {
      const base = computeLineTotals(line.unitPriceMinor, line.qty, line.gstMode, line.gstRateBasisPoints, line.modifierTotalMinor);
      const discountedSubtotal = Math.max(0, base.subtotalMinor - allocations[index]);
      const afterDiscount = computeLineTotals(
        Math.max(0, line.unitPriceMinor + line.modifierTotalMinor - Math.floor(allocations[index] / Math.max(1, line.qty))),
        line.qty,
        line.gstMode,
        line.gstRateBasisPoints,
        0
      );

      const taxMinor = line.gstMode === "inclusive" ? discountedSubtotal - afterDiscount.taxableMinor : afterDiscount.taxMinor;
      const grandTotalMinor = line.gstMode === "inclusive" ? discountedSubtotal : discountedSubtotal + taxMinor;

      return {
        lineSubtotalMinor: base.subtotalMinor,
        lineDiscountMinor: allocations[index],
        lineTaxMinor: taxMinor,
        lineGrandTotalMinor: grandTotalMinor
      };
    });
  }

  computeOrderTotals(
    lines: PricingLine[],
    appliedDiscount: Pick<AppliedDiscount, "type" | "value"> | null
  ): OrderTotals & { discountMinor: number } {
    const lineSubtotals = lines.map((line) =>
      computeLineTotals(line.unitPriceMinor, line.qty, line.gstMode, line.gstRateBasisPoints, line.modifierTotalMinor).subtotalMinor
    );
    const subtotalMinor = lineSubtotals.reduce((sum, value) => sum + value, 0);
    const discountMinor = appliedDiscount ? computeDiscountAmount(subtotalMinor, appliedDiscount.type, appliedDiscount.value) : 0;
    const allocations = allocateDiscount(lineSubtotals, discountMinor);

    let taxableMinor = 0;
    let taxMinor = 0;

    lines.forEach((line, index) => {
      const discountedSubtotal = Math.max(0, lineSubtotals[index] - allocations[index]);
      if (line.gstRateBasisPoints <= 0) {
        taxableMinor += discountedSubtotal;
        return;
      }

      if (line.gstMode === "inclusive") {
        const inclusiveTaxable = Math.round((discountedSubtotal * 10000) / (10000 + line.gstRateBasisPoints));
        taxableMinor += inclusiveTaxable;
        taxMinor += discountedSubtotal - inclusiveTaxable;
        return;
      }

      taxableMinor += discountedSubtotal;
      taxMinor += Math.round((discountedSubtotal * line.gstRateBasisPoints) / 10000);
    });

    return {
      subtotalMinor,
      discountMinor,
      taxableMinor,
      taxMinor,
      grandTotalMinor: taxableMinor + taxMinor
    };
  }
}
