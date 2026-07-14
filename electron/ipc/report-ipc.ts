import { ipcMain } from "electron";
import type Database from "better-sqlite3";
import { ZodError } from "zod";
import { ipcChannels } from "../../shared/contracts/ipc-contracts";
import { reportRangeSchema } from "../../shared/schemas/report-schemas";
import { validateIpcInput } from "../security/ipc-validation";
import { sessionStore } from "../security/session-store";
import { ReportService } from "../services/report-service";
import { fail, ok, toSafeError } from "./ipc-result";
export function registerReportIpc(db: Database.Database): void {
  const service = new ReportService(db);
  ipcMain.handle(ipcChannels.reportsSales, (_event, input: unknown) => {
    try { if (!sessionStore.getSession()) return fail("UNAUTHENTICATED", "Please log in to continue."); const p=validateIpcInput(reportRangeSchema,input); return ok(service.sales(p.from,p.to)); }
    catch(error){ if(error instanceof ZodError) return fail("INVALID_IPC_PAYLOAD","Report range is invalid."); const safe=toSafeError(error); return fail(safe.code,safe.message,safe.details); }
  });
}
