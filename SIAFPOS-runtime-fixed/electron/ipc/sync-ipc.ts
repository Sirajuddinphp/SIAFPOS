import { ipcMain } from "electron";
import type Database from "better-sqlite3";
import { ZodError } from "zod";
import { ipcChannels } from "../../shared/contracts/ipc-contracts";
import { configureSyncSchema } from "../../shared/schemas/sync-schemas";
import { validateIpcInput } from "../security/ipc-validation";
import { sessionStore } from "../security/session-store";
import { SyncError, SyncService } from "../services/sync-service";
import { fail, ok, toSafeError } from "./ipc-result";

export function registerSyncIpc(db: Database.Database): void {
  const service = new SyncService(db);
  const run = async <T>(fn: () => T | Promise<T>) => {
    if (!sessionStore.getSession()) return fail("UNAUTHENTICATED", "Please log in to continue.");
    try { return ok(await fn()); }
    catch (error) {
      if (error instanceof ZodError) return fail("INVALID_IPC_PAYLOAD", "Sync request is invalid.");
      if (error instanceof SyncError) return fail(error.code, error.message);
      const safe = toSafeError(error); return fail(safe.code, safe.message, safe.details);
    }
  };

  ipcMain.handle(ipcChannels.syncGetStatus, () => run(() => service.getStatus()));
  ipcMain.handle(ipcChannels.syncConfigure, (_event, input) => run(() => service.configure(validateIpcInput(configureSyncSchema, input))));
  ipcMain.handle(ipcChannels.syncProcess, () => run(() => service.process()));
  ipcMain.handle(ipcChannels.syncRetryFailed, () => run(() => service.retryFailed()));
}
