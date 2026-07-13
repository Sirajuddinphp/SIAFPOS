import { ipcMain } from "electron";
import type Database from "better-sqlite3";
import { ZodError } from "zod";
import { ipcChannels } from "../../shared/contracts/ipc-contracts";
import { settingsGetSchema, settingsSetSchema } from "../../shared/schemas/settings-schemas";
import { SettingsRepository } from "../repositories/settings-repository";
import { validateIpcInput } from "../security/ipc-validation";
import { fail, ok, toSafeError } from "./ipc-result";
import { logger } from "../logger/logger";

export function registerSettingsIpc(db: Database.Database): void {
  const repository = new SettingsRepository(db);

  ipcMain.handle(ipcChannels.settingsGet, (_event, input: unknown) => {
    try {
      const payload = validateIpcInput(settingsGetSchema, input);
      return ok(repository.get(payload.key));
    } catch (error) {
      return handleSettingsError(error);
    }
  });

  ipcMain.handle(ipcChannels.settingsSet, (_event, input: unknown) => {
    try {
      const payload = validateIpcInput(settingsSetSchema, input);
      return ok(repository.set(payload.key, payload.value, payload.type, payload.isSecure ?? false, new Date().toISOString()));
    } catch (error) {
      return handleSettingsError(error);
    }
  });
}

function handleSettingsError(error: unknown) {
  if (error instanceof ZodError) {
    return fail("INVALID_IPC_PAYLOAD", "Settings request is invalid.");
  }

  logger.error("ipc", "Settings IPC failed", error);
  const safeError = toSafeError(error);
  return fail(safeError.code, safeError.message, safeError.details);
}
