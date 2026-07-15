import { ipcMain } from "electron";
import type Database from "better-sqlite3";
import { ZodError } from "zod";
import { ipcChannels } from "../../shared/contracts/ipc-contracts";
import { adjustLoyaltySchema, saveCouponSchema, saveMembershipSchema } from "../../shared/schemas/crm-schemas";
import { validateIpcInput } from "../security/ipc-validation";
import { sessionStore } from "../security/session-store";
import { CrmService } from "../services/crm-service";
import { fail, ok, toSafeError } from "./ipc-result";
import { logger } from "../logger/logger";
export function registerCrmIpc(db:Database.Database):void{const s=new CrmService(db);const session=()=>sessionStore.getSession();ipcMain.handle(ipcChannels.crmDashboard,()=>handle(()=>session()?ok(s.dashboard()):fail("UNAUTHENTICATED","Please log in to continue.")));ipcMain.handle(ipcChannels.crmAdjust,(_e,input:unknown)=>handle(()=>{const x=session();if(!x)return fail("UNAUTHENTICATED","Please log in to continue.");return ok(s.adjust(validateIpcInput(adjustLoyaltySchema,input),x.user.uuid));}));ipcMain.handle(ipcChannels.crmSaveCoupon,(_e,input:unknown)=>handle(()=>session()?ok(s.saveCoupon(validateIpcInput(saveCouponSchema,input))):fail("UNAUTHENTICATED","Please log in to continue.")));ipcMain.handle(ipcChannels.crmSaveMembership,(_e,input:unknown)=>handle(()=>session()?ok(s.saveMembership(validateIpcInput(saveMembershipSchema,input))):fail("UNAUTHENTICATED","Please log in to continue.")));}
function handle(fn:()=>unknown){try{return fn();}catch(error){if(error instanceof ZodError)return fail("INVALID_IPC_PAYLOAD","CRM request is invalid.");logger.error("ipc","CRM IPC failed",error);const safe=toSafeError(error);return fail((error as {code?:string})?.code??safe.code,(error as Error)?.message??safe.message,safe.details);}}
