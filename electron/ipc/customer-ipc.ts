import { ipcMain } from "electron";
import type Database from "better-sqlite3";
import { ZodError } from "zod";
import { ipcChannels } from "../../shared/contracts/ipc-contracts";
import { customerRefSchema, customerSearchSchema, saveCustomerSchema } from "../../shared/schemas/customer-schemas";
import { validateIpcInput } from "../security/ipc-validation";
import { sessionStore } from "../security/session-store";
import { CustomerService } from "../services/customer-service";
import { fail, ok, toSafeError } from "./ipc-result";
import { logger } from "../logger/logger";
export function registerCustomerIpc(db:Database.Database):void{
 const service=new CustomerService(db); const auth=()=>!!sessionStore.getSession();
 ipcMain.handle(ipcChannels.customersSearch,(_e,input:unknown)=>handle(()=>{if(!auth())return fail("UNAUTHENTICATED","Please log in to continue.");const p=validateIpcInput(customerSearchSchema,input);return ok(service.search(p.query,p.limit??25));}));
 ipcMain.handle(ipcChannels.customersListRecent,()=>handle(()=>auth()?ok(service.listRecent()):fail("UNAUTHENTICATED","Please log in to continue.")));
 ipcMain.handle(ipcChannels.customersSave,(_e,input:unknown)=>handle(()=>{if(!auth())return fail("UNAUTHENTICATED","Please log in to continue.");return ok(service.save(validateIpcInput(saveCustomerSchema,input)));}));
 ipcMain.handle(ipcChannels.customersSetActive,(_e,input:unknown)=>handle(()=>{if(!auth())return fail("UNAUTHENTICATED","Please log in to continue.");const raw=input as {customerUuid?:unknown;isActive?:unknown};const p=validateIpcInput(customerRefSchema, {customerUuid:raw?.customerUuid}); if(typeof raw?.isActive!=="boolean")return fail("INVALID_IPC_PAYLOAD","Customer status is invalid."); return ok(service.setActive(p.customerUuid,raw.isActive));}));
}
function handle(fn:()=>unknown){try{return fn();}catch(error){if(error instanceof ZodError)return fail("INVALID_IPC_PAYLOAD","Customer request is invalid.");logger.error("ipc","Customer IPC failed",error);const safe=toSafeError(error);return fail(safe.code,safe.message,safe.details);}}
