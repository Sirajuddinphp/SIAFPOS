import { ipcMain } from "electron";
import type Database from "better-sqlite3";
import { ipcChannels } from "../../shared/contracts/ipc-contracts";
import { DatabaseHealthService } from "../services/database-health-service";
import { ok } from "./ipc-result";

export function registerDatabaseIpc(db: Database.Database): void {
  const service = new DatabaseHealthService(db);

  ipcMain.handle(ipcChannels.databaseGetHealth, () => ok(service.getHealth()));
  ipcMain.handle(ipcChannels.databaseGetVersion, () => ok(service.getVersion()));
}
