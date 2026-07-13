import { ipcMain } from "electron";
import type Database from "better-sqlite3";
import { ZodError } from "zod";
import { ipcChannels } from "../../shared/contracts/ipc-contracts";
import { closeShiftSchema, openShiftSchema } from "../../shared/schemas/billing-schemas";
import { validateIpcInput } from "../security/ipc-validation";
import { sessionStore } from "../security/session-store";
import { ShiftError, ShiftService } from "../services/shift-service";
import { fail, ok, toSafeError } from "./ipc-result";
export function registerShiftIpc(db:Database.Database){ const service=new ShiftService(db); const run=<T>(fn:(s:NonNullable<ReturnType<typeof sessionStore.getSession>>)=>T)=>{const s=sessionStore.getSession();if(!s)return fail("UNAUTHENTICATED","Please log in to continue.");try{return ok(fn(s));}catch(e){if(e instanceof ZodError)return fail("INVALID_IPC_PAYLOAD","Shift request is invalid.");if(e instanceof ShiftError)return fail(e.code,e.message);const x=toSafeError(e);return fail(x.code,x.message,x.details);}};
 ipcMain.handle(ipcChannels.shiftGetOpen,()=>run(s=>service.getOpen(s.terminal.uuid)));
 ipcMain.handle(ipcChannels.shiftOpen,(_e,input)=>run(s=>service.open(s.terminal.uuid,s.user.uuid,validateIpcInput(openShiftSchema,input).openingCashMinor)));
 ipcMain.handle(ipcChannels.shiftClose,(_e,input)=>run(s=>{const p=validateIpcInput(closeShiftSchema,input);return service.close(s.terminal.uuid,p.actualCashMinor,p.closingNote);})); }
