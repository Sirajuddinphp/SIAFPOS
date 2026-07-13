import type Database from "better-sqlite3";
import type { DiningTableSummary, FloorMap } from "../../shared/contracts/table-contracts";

type TableRow = {
  uuid: string;
  name: string;
  floor: string;
  capacity: number;
  sort_order: number;
  status: "available" | "occupied" | "held";
};

export class TableRepository {
  constructor(private readonly db: Database.Database) {}

  findByUuid(uuid: string): DiningTableSummary | null {
    const row = this.db.prepare("SELECT * FROM tables WHERE uuid = ?").get(uuid) as TableRow | undefined;
    return row ? mapTable(row) : null;
  }

  getFloorMap(): FloorMap {
    const rows = this.db.prepare("SELECT * FROM tables ORDER BY floor, sort_order, name").all() as TableRow[];
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
    sortOrder: row.sort_order
  };
}
