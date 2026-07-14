import type Database from "better-sqlite3";
import type { DailySalesRow, SalesReport, SalesSummary, TopItemRow } from "../../shared/contracts/report-contracts";

export class ReportRepository {
  constructor(private readonly db: Database.Database) {}

  sales(from: string, to: string): SalesReport {
    const aggregate = this.db.prepare(`
      SELECT COALESCE(SUM(subtotal_minor),0) gross_sales_minor,
             COALESCE(SUM(discount_minor),0) discount_minor,
             COALESCE(SUM(tax_minor),0) tax_minor,
             COALESCE(SUM(grand_total_minor),0) net_sales_minor,
             COUNT(*) order_count
      FROM bills WHERE status='settled' AND settled_at BETWEEN ? AND ?
    `).get(from, to) as any;
    const payments = this.db.prepare(`
      SELECT payment_mode, COALESCE(SUM(amount_minor),0) amount_minor
      FROM payments WHERE created_at BETWEEN ? AND ? GROUP BY payment_mode
    `).all(from, to) as Array<{payment_mode:string; amount_minor:number}>;
    const map = Object.fromEntries(payments.map((p) => [p.payment_mode, p.amount_minor]));
    const summary: SalesSummary = {
      from, to,
      grossSalesMinor: aggregate.gross_sales_minor,
      discountMinor: aggregate.discount_minor,
      taxMinor: aggregate.tax_minor,
      netSalesMinor: aggregate.net_sales_minor,
      orderCount: aggregate.order_count,
      averageOrderMinor: aggregate.order_count ? Math.round(aggregate.net_sales_minor / aggregate.order_count) : 0,
      cashMinor: map.cash ?? 0, upiMinor: map.upi ?? 0, cardMinor: map.card ?? 0,
      creditMinor: map.credit ?? 0, customMinor: map.custom ?? 0
    };
    const daily = this.db.prepare(`
      SELECT substr(settled_at,1,10) date, COUNT(*) order_count,
             COALESCE(SUM(grand_total_minor),0) net_sales_minor,
             COALESCE(SUM(tax_minor),0) tax_minor
      FROM bills WHERE status='settled' AND settled_at BETWEEN ? AND ?
      GROUP BY substr(settled_at,1,10) ORDER BY date DESC
    `).all(from, to).map((row:any): DailySalesRow => ({ date: row.date, orderCount: row.order_count, netSalesMinor: row.net_sales_minor, taxMinor: row.tax_minor }));
    const topItems = this.db.prepare(`
      SELECT oi.product_name product_name, COALESCE(SUM(oi.qty),0) quantity,
             COALESCE(SUM(oi.qty * oi.unit_price_minor),0) sales_minor
      FROM order_items oi JOIN bills b ON b.order_uuid=oi.order_uuid
      WHERE b.status='settled' AND b.settled_at BETWEEN ? AND ?
      GROUP BY oi.product_name ORDER BY quantity DESC, sales_minor DESC LIMIT 20
    `).all(from, to).map((row:any): TopItemRow => ({ productName: row.product_name, quantity: row.quantity, salesMinor: row.sales_minor }));
    return { summary, daily, topItems };
  }
}
