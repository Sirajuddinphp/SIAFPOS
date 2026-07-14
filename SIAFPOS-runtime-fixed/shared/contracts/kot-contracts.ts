import type { OrderType } from "./order-contracts";

export type KotStatus = "new" | "preparing" | "ready" | "completed";
export type KotTicketKind = "full" | "delta" | "cancel" | "reprint";
export type KotItemAction = "add" | "update" | "cancel";

export type KotItem = {
  uuid: string;
  orderItemUuid: string;
  productUuid: string;
  itemName: string;
  variantName: string | null;
  qty: number;
  lineAction: KotItemAction;
  kitchenNote: string | null;
  modifierNames: string[];
};

export type KotTicketSummary = {
  uuid: string;
  orderUuid: string;
  orderNo: string;
  orderType: OrderType;
  status: KotStatus;
  kind: KotTicketKind;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  printedAt: string | null;
  cancelledAt: string | null;
  referenceKotUuid: string | null;
  tableName: string | null;
  waiterName: string | null;
};

export type KotTicketDetail = KotTicketSummary & {
  customerName: string | null;
  items: KotItem[];
  history: Array<{
    uuid: string;
    fromStatus: KotStatus | null;
    toStatus: KotStatus;
    reason: string | null;
    createdAt: string;
  }>;
};

export type KotPreview = {
  orderUuid: string;
  orderNo: string;
  orderType: OrderType;
  ticketKind: "full" | "delta";
  items: KotItem[];
};

export type KotOrderRefInput = {
  orderUuid: string;
};

export type KotRefInput = {
  kotUuid: string;
};

export type CancelKotInput = {
  kotUuid: string;
  reason?: string;
};
