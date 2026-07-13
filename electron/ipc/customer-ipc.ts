import { ipcMain } from "electron";
import type Database from "better-sqlite3";
import { ZodError } from "zod";
import { ipcChannels } from "../../shared/contracts/ipc-contracts";
import { customerSearchSchema } from "../../shared/schemas/customer-schemas";
import { validateIpcInput } from "../security/ipc-validation";
import { sessionStore } from "../security/session-store";
import { CustomerService } from "../services/customer-service";
import { fail, ok, toSafeError } from "./ipc-result";
import { logger } from "../logger/logger";

export function registerCustomerIpc(db: Database.Database): void {
  const service = new CustomerService(db);

  ipcMain.handle(ipcChannels.customersSearch, (_event, input: unknown) => {
    try {
      if (!sessionStore.getSession()) {
        return fail("UNAUTHENTICATED", "Please log in to continue.");
      }
      const payload = validateIpcInput(customerSearchSchema, input);
      return ok(service.search(payload.query, payload.limit ?? 12));
    } catch (error) {
      return handleError(error);
    }
  });

  ipcMain.handle(ipcChannels.customersListRecent, () => {
    try {
      if (!sessionStore.getSession()) {
        return fail("UNAUTHENTICATED", "Please log in to continue.");
      }
      return ok(service.listRecent());
    } catch (error) {
      return handleError(error);
    }
  });
}

function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return fail("INVALID_IPC_PAYLOAD", "Customer request is invalid.");
  }

  logger.error("ipc", "Customer IPC failed", error);
  const safeError = toSafeError(error);
  return fail(safeError.code, safeError.message, safeError.details);
}
