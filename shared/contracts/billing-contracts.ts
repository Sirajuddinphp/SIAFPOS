export type PaymentMode = "cash" | "upi" | "card" | "credit" | "custom";
export type ShiftStatus = "open" | "closed";
export type BillStatus = "open" | "settled" | "void";

export type PaymentInput = {
  mode: PaymentMode;
  amountMinor: number;
  reference?: string;
  receivedMinor?: number;
};

export type PaymentRecord = PaymentInput & {
  uuid: string;
  changeMinor: number;
  createdAt: string;
};

export type CashShift = {
  uuid: string;
  terminalUuid: string;
  userUuid: string;
  status: ShiftStatus;
  openingCashMinor: number;
  cashSalesMinor: number;
  expectedCashMinor: number;
  actualCashMinor: number | null;
  differenceMinor: number | null;
  openedAt: string;
  closedAt: string | null;
  closingNote: string | null;
};

export type BillDetail = {
  uuid: string;
  billNo: string;
  orderUuid: string;
  orderNo: string;
  status: BillStatus;
  subtotalMinor: number;
  discountMinor: number;
  taxableMinor: number;
  taxMinor: number;
  grandTotalMinor: number;
  paidMinor: number;
  balanceMinor: number;
  payments: PaymentRecord[];
  settledAt: string | null;
  createdAt: string;
};

export type BillPreview = {
  orderUuid: string; orderNo: string; status: "preview"; subtotalMinor: number; discountMinor: number; taxableMinor: number; taxMinor: number; grandTotalMinor: number; paidMinor: number; balanceMinor: number; payments: PaymentRecord[];
};

export type OpenShiftInput = { openingCashMinor: number };
export type CloseShiftInput = { actualCashMinor: number; closingNote?: string };
export type BillOrderRefInput = { orderUuid: string };
export type SettleBillInput = { orderUuid: string; payments: PaymentInput[] };
export type BillRefInput = { billUuid: string };
export type PrintReceiptResult = { printJobUuid: string; billUuid: string; copyType: "original" | "duplicate"; status: "pending" };
