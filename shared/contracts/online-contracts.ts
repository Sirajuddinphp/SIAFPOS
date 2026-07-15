export type OnlineChannel = {
  uuid: string;
  name: string;
  channelType: "qr" | "website" | "mealhi5" | "custom";
  isActive: boolean;
  autoAccept: boolean;
};

export type QrTableToken = {
  uuid: string;
  tableUuid: string;
  tableName: string;
  token: string;
  orderingUrl: string;
  isActive: boolean;
};

export type OnlineOrderItem = {
  uuid: string;
  itemName: string;
  qty: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
  note: string | null;
};

export type OnlineOrder = {
  uuid: string;
  channelName: string | null;
  externalOrderId: string | null;
  orderType: "dine_in" | "takeaway" | "delivery";
  status: "pending" | "accepted" | "preparing" | "ready" | "completed" | "rejected" | "cancelled";
  customerName: string;
  customerPhone: string | null;
  addressSummary: string | null;
  tableName: string | null;
  notes: string | null;
  grandTotalMinor: number;
  paymentStatus: "unpaid" | "paid" | "cod";
  receivedAt: string;
  items: OnlineOrderItem[];
};

export type OnlineDashboard = {
  channels: OnlineChannel[];
  qrTokens: QrTableToken[];
  orders: OnlineOrder[];
  pendingCount: number;
};

export type SaveOnlineChannelInput = {
  channelUuid?: string;
  name: string;
  channelType: "qr" | "website" | "mealhi5" | "custom";
  isActive?: boolean;
  autoAccept?: boolean;
};

export type GenerateQrTokenInput = { tableUuid: string };
export type UpdateOnlineOrderStatusInput = {
  orderUuid: string;
  status: OnlineOrder["status"];
};
export type CreateOnlineOrderInput = {
  channelUuid?: string | null;
  externalOrderId?: string | null;
  orderType: "dine_in" | "takeaway" | "delivery";
  customerName: string;
  customerPhone?: string | null;
  addressSummary?: string | null;
  tableUuid?: string | null;
  notes?: string | null;
  paymentStatus?: "unpaid" | "paid" | "cod";
  items: Array<{ productUuid?: string | null; itemName: string; qty: number; unitPriceMinor: number; note?: string | null }>;
};
