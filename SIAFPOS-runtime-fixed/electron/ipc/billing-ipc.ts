import { ipcMain } from "electron";
import type Database from "better-sqlite3";
import { ZodError } from "zod";
import { ipcChannels } from "../../shared/contracts/ipc-contracts";
import { billOrderRefSchema,billRefSchema,settleBillSchema } from "../../shared/schemas/billing-schemas";
import { validateIpcInput } from "../security/ipc-validation";
import { sessionStore } from "../security/session-store";
import { BillingError,BillingService } from "../services/billing-service";
import { fail,ok,toSafeError } from "./ipc-result";
export function registerBillingIpc(db:Database.Database){const service=new BillingService(db);const run=<T>(fn:(s:NonNullable<ReturnType<typeof sessionStore.getSession>>)=>T)=>{const s=sessionStore.getSession();if(!s)return fail("UNAUTHENTICATED","Please log in to continue.");try{return ok(fn(s));}catch(e){if(e instanceof ZodError)return fail("INVALID_IPC_PAYLOAD","Billing request is invalid.");if(e instanceof BillingError)return fail(e.code,e.message);const x=toSafeError(e);return fail(x.code,x.message,x.details);}};
 ipcMain.handle(ipcChannels.billingPreview,(_e,i)=>run(()=>service.preview(validateIpcInput(billOrderRefSchema,i).orderUuid)));
 ipcMain.handle(ipcChannels.billingSettle,(_e,i)=>run(s=>{const p=validateIpcInput(settleBillSchema,i);return service.settle(p.orderUuid,p.payments,{userUuid:s.user.uuid,terminalUuid:s.terminal.uuid});}));
 ipcMain.handle(ipcChannels.billingGetByOrder,(_e,i)=>run(()=>service.getByOrder(validateIpcInput(billOrderRefSchema,i).orderUuid)));
 ipcMain.handle(ipcChannels.billingPrintReceipt,(_e,i)=>run(s=>service.queueReceipt(validateIpcInput(billRefSchema,i).billUuid,s.user.uuid)));}
