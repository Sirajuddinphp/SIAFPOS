import type { CustomerSummary } from "./customer-contracts";
import type { DiningTableSummary, WaiterSummary } from "./table-contracts";
import type { GstPricingMode, ModifierGroup, ProductVariant } from "./catalog-contracts";

export type OrderType = "dine_in" | "takeaway" | "delivery";
export type OrderStatus = "draft" | "active" | "held";
export type DiscountType = "fixed" | "percentage";

export type AppliedDiscount = {
  type: DiscountType;
  value: number;
  amountMinor: number;
};

export type OrderItemModifier = {
  uuid: string;
  modifierUuid: string;
  groupUuid: string;
  name: string;
  priceDeltaMinor: number;
};

export type OrderItemDraft = {
  uuid: string;
  productUuid: string;
  productName: string;
  variantUuid: string | null;
  variantName: string | null;
  qty: number;
  unitPriceMinor: number;
  gstMode: GstPricingMode;
  gstRateBasisPoints: number;
  kitchenNote: string | null;
  modifiers: OrderItemModifier[];
  availableVariants: ProductVariant[];
  availableModifierGroups: ModifierGroup[];
  lineSubtotalMinor: number;
  lineDiscountMinor: number;
  lineTaxMinor: number;
  lineGrandTotalMinor: number;
};

export type OrderTotals = {
  subtotalMinor: number;
  discountMinor: number;
  taxableMinor: number;
  taxMinor: number;
  grandTotalMinor: number;
};

export type OrderDraft = {
  uuid: string;
  orderNo: string;
  orderType: OrderType;
  status: OrderStatus;
  customer: CustomerSummary | null;
  table: DiningTableSummary | null;
  waiter: WaiterSummary | null;
  discount: AppliedDiscount | null;
  items: OrderItemDraft[];
  totals: OrderTotals;
  updatedAt: string;
};

export type CreateOrderDraftInput = {
  orderType: OrderType;
};

export type AddOrderItemInput = {
  orderUuid: string;
  productUuid: string;
  variantUuid?: string;
};

export type UpdateOrderItemQuantityInput = {
  orderUuid: string;
  orderItemUuid: string;
  quantity: number;
};

export type RemoveOrderItemInput = {
  orderUuid: string;
  orderItemUuid: string;
};

export type SetOrderItemVariantInput = {
  orderUuid: string;
  orderItemUuid: string;
  variantUuid: string;
};

export type SetOrderItemModifiersInput = {
  orderUuid: string;
  orderItemUuid: string;
  modifierUuids: string[];
};

export type SetOrderItemNoteInput = {
  orderUuid: string;
  orderItemUuid: string;
  kitchenNote: string;
};

export type SetOrderCustomerInput = {
  orderUuid: string;
  customerUuid: string | null;
};

export type SetOrderTypeInput = {
  orderUuid: string;
  orderType: OrderType;
};

export type SetOrderTableInput = {
  orderUuid: string;
  tableUuid: string | null;
};

export type SetOrderWaiterInput = {
  orderUuid: string;
  waiterUuid: string | null;
};

export type ApplyOrderDiscountInput = {
  orderUuid: string;
  type: DiscountType;
  value: number;
};

export type RemoveOrderDiscountInput = {
  orderUuid: string;
};

export type HoldOrderInput = {
  orderUuid: string;
};

export type RecallHeldOrderInput = {
  orderUuid: string;
};

export type OrderRefInput = {
  orderUuid: string;
};

export type HeldOrderSummary = {
  uuid: string;
  orderNo: string;
  orderType: OrderType;
  itemCount: number;
  grandTotalMinor: number;
  tableName: string | null;
  customerName: string | null;
  heldAt: string;
  updatedAt: string;
};

export type RunningOrderSummary = {
  uuid: string;
  orderNo: string;
  orderType: OrderType;
  status: OrderStatus;
  itemCount: number;
  grandTotalMinor: number;
  tableName: string | null;
  customerName: string | null;
  waiterName: string | null;
  updatedAt: string;
};
