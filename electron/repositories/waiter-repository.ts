import type Database from "better-sqlite3";
import type { WaiterSummary } from "../../shared/contracts/table-contracts";

type WaiterRow = {
  uuid: string;
  name: string;
  code: string;
  status: "active" | "inactive";
};

export class WaiterRepository {
  constructor(private readonly db: Database.Database) {}

  listActive(): WaiterSummary[] {
    return (
      this.db
        .prepare("SELECT uuid, name, code, status FROM waiters WHERE status = 'active' ORDER BY name")
        .all() as WaiterRow[]
    ).map(mapWaiter);
  }

  findByUuid(uuid: string): WaiterSummary | null {
    const row = this.db.prepare("SELECT uuid, name, code, status FROM waiters WHERE uuid = ?").get(uuid) as WaiterRow | undefined;
    return row ? mapWaiter(row) : null;
  }
}

function mapWaiter(row: WaiterRow): WaiterSummary {
  return {
    uuid: row.uuid,
    name: row.name,
    code: row.code,
    status: row.status
  };
}
