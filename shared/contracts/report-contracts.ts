export type ReportRangeInput = { from: string; to: string };

export type SalesSummary = {
  from: string;
  to: string;
  grossSalesMinor: number;
  discountMinor: number;
  taxMinor: number;
  netSalesMinor: number;
  orderCount: number;
  averageOrderMinor: number;
  cashMinor: number;
  upiMinor: number;
  cardMinor: number;
  creditMinor: number;
  customMinor: number;
};

export type DailySalesRow = {
  date: string;
  orderCount: number;
  netSalesMinor: number;
  taxMinor: number;
};

export type TopItemRow = {
  productName: string;
  quantity: number;
  salesMinor: number;
};

export type SalesReport = {
  summary: SalesSummary;
  daily: DailySalesRow[];
  topItems: TopItemRow[];
};
