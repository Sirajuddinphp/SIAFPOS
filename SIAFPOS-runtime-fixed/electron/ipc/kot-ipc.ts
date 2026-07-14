import { ipcMain } from "electron";
import type Database from "better-sqlite3";
import { ZodError } from "zod";
import { ipcChannels } from "../../shared/contracts/ipc-contracts";
import { cancelKotSchema, kotOrderRefSchema, kotRefSchema } from "../../shared/schemas/kot-schemas";
import { logger } from "../logger/logger";
import { validateIpcInput } from "../security/ipc-validation";
import { sessionStore } from "../security/session-store";
import { KotError, KotService } from "../services/kot-service";
import { PrinterService } from "../services/printer-service";
import { fail, ok, toSafeError } from "./ipc-result";

export function registerKotIpc(db: Database.Database): void {
  const service = new KotService(db);
  const printers = new PrinterService(db);

  const withSession = <T>(work: (session: NonNullable<ReturnType<typeof sessionStore.getSession>>) => T) => {
    const session = sessionStore.getSession();
    if (!session) {
      return fail("UNAUTHENTICATED", "Please log in to continue.");
    }

    try {
      return work(session);
    } catch (error) {
      return handleError(error);
    }
  };

  ipcMain.handle(ipcChannels.kotPreview, (_event, input: unknown) =>
    withSession(() => ok(service.preview(validateIpcInput(kotOrderRefSchema, input).orderUuid)))
  );
  ipcMain.handle(ipcChannels.kotCreate, (_event, input: unknown) =>
    withSession((session) => { const ticket = service.create(validateIpcInput(kotOrderRefSchema, input).orderUuid, session.user.uuid); try { printers.queueKot(ticket.uuid, session.user.uuid); } catch {} return ok(ticket); })
  );
  ipcMain.handle(ipcChannels.kotGet, (_event, input: unknown) =>
    withSession(() => ok(service.get(validateIpcInput(kotRefSchema, input).kotUuid)))
  );
  ipcMain.handle(ipcChannels.kotListByOrder, (_event, input: unknown) =>
    withSession(() => ok(service.listByOrder(validateIpcInput(kotOrderRefSchema, input).orderUuid)))
  );
  ipcMain.handle(ipcChannels.kotCancel, (_event, input: unknown) =>
    withSession((session) => {
      const payload = validateIpcInput(cancelKotSchema, input);
      const ticket = service.cancel(payload.kotUuid, session.user.uuid, payload.reason); try { printers.queueKot(ticket.uuid, session.user.uuid); } catch {} return ok(ticket);
    })
  );
  ipcMain.handle(ipcChannels.kotMarkStarted, (_event, input: unknown) =>
    withSession((session) => ok(service.markStarted(validateIpcInput(kotRefSchema, input).kotUuid, session.user.uuid)))
  );
  ipcMain.handle(ipcChannels.kotMarkReady, (_event, input: unknown) =>
    withSession((session) => ok(service.markReady(validateIpcInput(kotRefSchema, input).kotUuid, session.user.uuid)))
  );
  ipcMain.handle(ipcChannels.kotMarkCompleted, (_event, input: unknown) =>
    withSession((session) => ok(service.markCompleted(validateIpcInput(kotRefSchema, input).kotUuid, session.user.uuid)))
  );
  ipcMain.handle(ipcChannels.kotReprint, (_event, input: unknown) =>
    withSession((session) => { const ticket = service.reprint(validateIpcInput(kotRefSchema, input).kotUuid, session.user.uuid); try { printers.queueKot(ticket.uuid, session.user.uuid); } catch {} return ok(ticket); })
  );
}

function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return fail("INVALID_IPC_PAYLOAD", "KOT request is invalid.");
  }
  if (error instanceof KotError) {
    return fail(error.code, error.message);
  }

  logger.error("ipc", "KOT IPC failed", error);
  const safeError = toSafeError(error);
  return fail(safeError.code, safeError.message, safeError.details);
}
