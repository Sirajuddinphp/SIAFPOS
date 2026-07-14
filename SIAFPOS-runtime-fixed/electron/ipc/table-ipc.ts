import { ipcMain } from "electron";
import type Database from "better-sqlite3";
import { ipcChannels } from "../../shared/contracts/ipc-contracts";
import { sessionStore } from "../security/session-store";
import { TableService } from "../services/table-service";
import { fail, ok, toSafeError } from "./ipc-result";
import { logger } from "../logger/logger";

export function registerTableIpc(db: Database.Database): void {
  const service = new TableService(db);

  ipcMain.handle(ipcChannels.tablesGetFloorMap, () => {
    try {
      if (!sessionStore.getSession()) {
        return fail("UNAUTHENTICATED", "Please log in to continue.");
      }
      return ok(service.getFloorMap());
    } catch (error) {
      logger.error("ipc", "Table floor IPC failed", error);
      const safeError = toSafeError(error);
      return fail(safeError.code, safeError.message, safeError.details);
    }
  });

  ipcMain.handle(ipcChannels.tablesListWaiters, () => {
    try {
      if (!sessionStore.getSession()) {
        return fail("UNAUTHENTICATED", "Please log in to continue.");
      }
      return ok(service.listWaiters());
    } catch (error) {
      logger.error("ipc", "Table waiter IPC failed", error);
      const safeError = toSafeError(error);
      return fail(safeError.code, safeError.message, safeError.details);
    }
  });
}
