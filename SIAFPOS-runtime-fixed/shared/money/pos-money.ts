import type { DiscountType } from "../contracts/order-contracts";
import type { GstPricingMode } from "../contracts/catalog-contracts";

export type TaxComputation = {
  subtotalMinor: number;
  taxableMinor: number;
  taxMinor: number;
  grandTotalMinor: number;
};

export function computeLineTotals(
  unitPriceMinor: number,
  quantity: number,
  gstMode: GstPricingMode,
  gstRateBasisPoints: number,
  modifierTotalMinor = 0
): TaxComputation {
  const subtotalMinor = Math.max(0, unitPriceMinor + modifierTotalMinor) * Math.max(0, quantity);
  if (gstRateBasisPoints <= 0) {
    return {
      subtotalMinor,
      taxableMinor: subtotalMinor,
      taxMinor: 0,
      grandTotalMinor: subtotalMinor
    };
  }

  if (gstMode === "inclusive") {
    const taxableMinor = roundMinor((subtotalMinor * 10000) / (10000 + gstRateBasisPoints));
    const taxMinor = subtotalMinor - taxableMinor;
    return {
      subtotalMinor,
      taxableMinor,
      taxMinor,
      grandTotalMinor: subtotalMinor
    };
  }

  const taxMinor = roundMinor((subtotalMinor * gstRateBasisPoints) / 10000);
  return {
    subtotalMinor,
    taxableMinor: subtotalMinor,
    taxMinor,
    grandTotalMinor: subtotalMinor + taxMinor
  };
}

export function computeDiscountAmount(
  subtotalMinor: number,
  type: DiscountType,
  value: number
): number {
  if (subtotalMinor <= 0 || value <= 0) {
    return 0;
  }

  if (type === "fixed") {
    return Math.min(subtotalMinor, roundMinor(value));
  }

  return Math.min(subtotalMinor, roundMinor((subtotalMinor * value) / 100));
}

export function allocateDiscount(lineSubtotals: number[], discountMinor: number): number[] {
  if (discountMinor <= 0 || lineSubtotals.length === 0) {
    return lineSubtotals.map(() => 0);
  }

  const subtotal = lineSubtotals.reduce((sum, value) => sum + value, 0);
  if (subtotal <= 0) {
    return lineSubtotals.map(() => 0);
  }

  const allocations = lineSubtotals.map((value) => roundMinor((discountMinor * value) / subtotal));
  const allocated = allocations.reduce((sum, value) => sum + value, 0);
  const remainder = discountMinor - allocated;

  if (remainder !== 0) {
    const largestIndex = lineSubtotals
      .map((value, index) => ({ value, index }))
      .sort((left, right) => right.value - left.value)[0]?.index;

    if (largestIndex !== undefined) {
      allocations[largestIndex] += remainder;
    }
  }

  return allocations;
}

export function roundMinor(value: number): number {
  return Math.round(value);
}
