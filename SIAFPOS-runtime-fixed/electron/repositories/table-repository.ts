import type Database from "better-sqlite3";
import type { DiningTableSummary, FloorMap } from "../../shared/contracts/table-contracts";

type TableRow = {
  uuid: string;
  name: string;
  floor: string;
  capacity: number;
  sort_order: number;
  status: "available" | "occupied" | "held";
  active_order_uuid: string | null;
};

export class TableRepository {
  constructor(private readonly db: Database.Database) {}

  findByUuid(uuid: string): DiningTableSummary | null {
    const row = this.db.prepare(`
      SELECT t.*,
             ao.uuid AS active_order_uuid,
             CASE
               WHEN ao.uuid IS NOT NULL THEN 'occupied'
               ELSE t.status
             END AS status
      FROM tables t
      LEFT JOIN orders ao ON ao.uuid = (
        SELECT o.uuid
        FROM orders o
        WHERE o.table_uuid = t.uuid
          AND o.status IN ('draft', 'active', 'held')
          AND NOT EXISTS (
            SELECT 1 FROM bills b
            WHERE b.order_uuid = o.uuid AND b.status = 'settled'
          )
        ORDER BY o.updated_at DESC
        LIMIT 1
      )
      WHERE t.uuid = ?
    `).get(uuid) as TableRow | undefined;
    return row ? mapTable(row) : null;
  }

  getFloorMap(): FloorMap {
    const rows = this.db.prepare(`
      SELECT t.*,
             ao.uuid AS active_order_uuid,
             CASE
               WHEN ao.uuid IS NOT NULL THEN 'occupied'
               ELSE t.status
             END AS status
      FROM tables t
      LEFT JOIN orders ao ON ao.uuid = (
        SELECT o.uuid
        FROM orders o
        WHERE o.table_uuid = t.uuid
          AND o.status IN ('draft', 'active', 'held')
          AND NOT EXISTS (
            SELECT 1 FROM bills b
            WHERE b.order_uuid = o.uuid AND b.status = 'settled'
          )
        ORDER BY o.updated_at DESC
        LIMIT 1
      )
      ORDER BY t.floor, t.sort_order, t.name
    `).all() as TableRow[];
    return {
      floors: Array.from(new Set(rows.map((row) => row.floor))),
      tables: rows.map(mapTable)
    };
  }
}

function mapTable(row: TableRow): DiningTableSummary {
  return {
    uuid: row.uuid,
    name: row.name,
    floor: row.floor,
    capacity: row.capacity,
    status: row.status,
    sortOrder: row.sort_order,
    activeOrderUuid: row.active_order_uuid
  };
}
