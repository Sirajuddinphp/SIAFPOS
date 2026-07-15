import { ipcMain } from "electron";
import type Database from "better-sqlite3";
import { ZodError } from "zod";
import { ipcChannels } from "../../shared/contracts/ipc-contracts";
import { createOnlineOrderSchema, generateQrTokenSchema, saveOnlineChannelSchema, updateOnlineOrderStatusSchema } from "../../shared/schemas/online-schemas";
import { validateIpcInput } from "../security/ipc-validation";
import { sessionStore } from "../security/session-store";
import { OnlineService } from "../services/online-service";
import { fail, ok, toSafeError } from "./ipc-result";
import { logger } from "../logger/logger";
export function registerOnlineIpc(db:Database.Database):void{const s=new OnlineService(db);const auth=()=>!!sessionStore.getSession();ipcMain.handle(ipcChannels.onlineDashboard,()=>handle(()=>auth()?ok(s.dashboard()):fail("UNAUTHENTICATED","Please log in to continue.")));ipcMain.handle(ipcChannels.onlineSaveChannel,(_e,input:unknown)=>handle(()=>auth()?ok(s.saveChannel(validateIpcInput(saveOnlineChannelSchema,input))):fail("UNAUTHENTICATED","Please log in to continue.")));ipcMain.handle(ipcChannels.onlineGenerateQr,(_e,input:unknown)=>handle(()=>auth()?ok(s.generateQr(validateIpcInput(generateQrTokenSchema,input))):fail("UNAUTHENTICATED","Please log in to continue.")));ipcMain.handle(ipcChannels.onlineCreateOrder,(_e,input:unknown)=>handle(()=>auth()?ok(s.createOrder(validateIpcInput(createOnlineOrderSchema,input))):fail("UNAUTHENTICATED","Please log in to continue.")));ipcMain.handle(ipcChannels.onlineUpdateStatus,(_e,input:unknown)=>handle(()=>auth()?ok(s.updateStatus(validateIpcInput(updateOnlineOrderStatusSchema,input))):fail("UNAUTHENTICATED","Please log in to continue.")));}
function handle(fn:()=>unknown){try{return fn();}catch(error){if(error instanceof ZodError)return fail("INVALID_IPC_PAYLOAD","Online order request is invalid.");logger.error("ipc","Online IPC failed",error);const safe=toSafeError(error);return fail((error as {code?:string})?.code??safe.code,(error as Error)?.message??safe.message,safe.details);}}
