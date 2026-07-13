import { ipcMain } from "electron";
import type Database from "better-sqlite3";
import { ipcChannels } from "../../shared/contracts/ipc-contracts";
import { SystemService } from "../services/system-service";
import { fail, ok, toSafeError } from "./ipc-result";
import { logger } from "../logger/logger";

export function registerSystemIpc(db: Database.Database): void {
  const service = new SystemService(db);

  ipcMain.handle(ipcChannels.systemGetAppInfo, () => ok(service.getAppInfo()));
  ipcMain.handle(ipcChannels.systemGetHealth, () => ok(service.getHealth()));
  ipcMain.handle(ipcChannels.systemGetConnectivity, async () => {
    try {
      return ok(await service.getConnectivity());
    } catch (error) {
      logger.error("ipc", "Connectivity IPC failed", error);
      const safeError = toSafeError(error);
      return fail(safeError.code, safeError.message, safeError.details);
    }
  });
}
