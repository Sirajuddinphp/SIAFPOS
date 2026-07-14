import type Database from "better-sqlite3";
import type { FloorMap, WaiterSummary } from "../../shared/contracts/table-contracts";
import { TableRepository } from "../repositories/table-repository";
import { WaiterRepository } from "../repositories/waiter-repository";

export class TableService {
  private readonly tables: TableRepository;
  private readonly waiters: WaiterRepository;

  constructor(db: Database.Database) {
    this.tables = new TableRepository(db);
    this.waiters = new WaiterRepository(db);
  }

  getFloorMap(): FloorMap {
    return this.tables.getFloorMap();
  }

  listWaiters(): WaiterSummary[] {
    return this.waiters.listActive();
  }
}
