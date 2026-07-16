import { ipcMain } from "electron";
import type Database from "better-sqlite3";
import { ipcChannels } from "../../shared/contracts/ipc-contracts";
import { activateLicenseSchema, createApiKeySchema, enterpriseRefSchema, registerDeviceSchema } from "../../shared/schemas/enterprise-schemas";
import { validateIpcInput } from "../security/ipc-validation";
import { sessionStore } from "../security/session-store";
import { EnterpriseService } from "../services/enterprise-service";
import { fail, ok, toSafeError } from "./ipc-result";
export function registerEnterpriseIpc(db:Database.Database):void{
  const s=new EnterpriseService(db); const session=()=>sessionStore.getSession();
  const wrap=async<T>(fn:()=>T|Promise<T>)=>{try{return ok(await fn());}catch(e){const x=toSafeError(e);return fail(x.code,x.message,x.details);}};
  ipcMain.handle(ipcChannels.enterpriseDashboard,()=>wrap(()=>{if(!session())throw new Error("UNAUTHENTICATED");return s.dashboard();}));
  ipcMain.handle(ipcChannels.enterpriseActivateLicense,(_e,i)=>wrap(()=>{const x=session();if(!x)throw new Error("UNAUTHENTICATED");return s.activateLicense(validateIpcInput(activateLicenseSchema,i),x.user.uuid);}));
  ipcMain.handle(ipcChannels.enterpriseRegisterDevice,(_e,i)=>wrap(()=>{const x=session();if(!x)throw new Error("UNAUTHENTICATED");return s.registerDevice(validateIpcInput(registerDeviceSchema,i),x.user.uuid);}));
  ipcMain.handle(ipcChannels.enterpriseRevokeDevice,(_e,i)=>wrap(()=>{const x=session();if(!x)throw new Error("UNAUTHENTICATED");return s.revokeDevice(validateIpcInput(enterpriseRefSchema,i).uuid,x.user.uuid);}));
  ipcMain.handle(ipcChannels.enterpriseCreateApiKey,(_e,i)=>wrap(()=>{const x=session();if(!x)throw new Error("UNAUTHENTICATED");return s.createApiKey(validateIpcInput(createApiKeySchema,i),x.user.uuid);}));
  ipcMain.handle(ipcChannels.enterpriseRevokeApiKey,(_e,i)=>wrap(()=>{const x=session();if(!x)throw new Error("UNAUTHENTICATED");return s.revokeApiKey(validateIpcInput(enterpriseRefSchema,i).uuid,x.user.uuid);}));
  ipcMain.handle(ipcChannels.enterpriseCreateBackup,()=>wrap(()=>{const x=session();if(!x)throw new Error("UNAUTHENTICATED");return s.createBackup(x.user.uuid);}));
  ipcMain.handle(ipcChannels.enterpriseRequestRestore,(_e,i)=>wrap(()=>{const x=session();if(!x)throw new Error("UNAUTHENTICATED");return s.requestRestore(validateIpcInput(enterpriseRefSchema,i).uuid,x.user.uuid);}));
}
