import type Database from "better-sqlite3";
import type { HeldOrderSummary } from "../../shared/contracts/order-contracts";

type HeldRow = {
  uuid: string;
  order_no: string;
  order_type: "dine_in" | "takeaway" | "delivery";
  grand_total_minor: number;
  held_at: string;
  updated_at: string;
  table_name: string | null;
  customer_name: string | null;
  item_count: number;
};

export class HeldOrderRepository {
  constructor(private readonly db: Database.Database) {}

  listHeld(): HeldOrderSummary[] {
    const rows = this.db
      .prepare(
        `SELECT o.uuid, o.order_no, o.order_type, o.grand_total_minor, ho.held_at, o.updated_at,
                t.name AS table_name, c.name AS customer_name, COALESCE(SUM(oi.qty), 0) AS item_count
         FROM held_orders ho
         INNER JOIN orders o ON o.uuid = ho.order_uuid
         LEFT JOIN tables t ON t.uuid = o.table_uuid
         LEFT JOIN customers c ON c.uuid = o.customer_uuid
         LEFT JOIN order_items oi ON oi.order_uuid = o.uuid
         GROUP BY o.uuid
         ORDER BY ho.held_at DESC`
      )
      .all() as HeldRow[];

    return rows.map((row) => ({
      uuid: row.uuid,
      orderNo: row.order_no,
      orderType: row.order_type,
      itemCount: row.item_count,
      grandTotalMinor: row.grand_total_minor,
      tableName: row.table_name,
      customerName: row.customer_name,
      heldAt: row.held_at,
      updatedAt: row.updated_at
    }));
  }
}
