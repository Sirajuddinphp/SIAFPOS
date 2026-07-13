import { ipcMain } from "electron";
import type Database from "better-sqlite3";
import { ZodError } from "zod";
import { ipcChannels } from "../../shared/contracts/ipc-contracts";
import { passwordLoginSchema, pinLoginSchema } from "../../shared/schemas/auth-schemas";
import { validateIpcInput } from "../security/ipc-validation";
import { AuthError, AuthService } from "../services/auth-service";
import { fail, ok, toSafeError } from "./ipc-result";
import { logger } from "../logger/logger";

export function registerAuthIpc(db: Database.Database): void {
  const service = new AuthService(db);

  ipcMain.handle(ipcChannels.authLoginPassword, (_event, input: unknown) => {
    try {
      return ok(service.loginWithPassword(validateIpcInput(passwordLoginSchema, input)));
    } catch (error) {
      return handleAuthError(error);
    }
  });

  ipcMain.handle(ipcChannels.authLoginPin, (_event, input: unknown) => {
    try {
      return ok(service.loginWithPin(validateIpcInput(pinLoginSchema, input)));
    } catch (error) {
      return handleAuthError(error);
    }
  });

  ipcMain.handle(ipcChannels.authGetSession, () => ok(service.getSession()));
  ipcMain.handle(ipcChannels.authLogout, () => {
    try {
      return ok(service.logout());
    } catch (error) {
      logger.error("ipc", "Logout IPC failed", error);
      const safeError = toSafeError(error);
      return fail(safeError.code, safeError.message, safeError.details);
    }
  });
}

function handleAuthError(error: unknown) {
  if (error instanceof ZodError) {
    logger.warn("ipc", "Auth IPC validation failed");
    return fail("INVALID_IPC_PAYLOAD", "Login request is invalid.");
  }

  if (error instanceof AuthError) {
    return fail(error.code, error.message);
  }

  logger.error("ipc", "Auth IPC failed", error);
  const safeError = toSafeError(error);
  return fail(safeError.code, safeError.message, safeError.details);
}
