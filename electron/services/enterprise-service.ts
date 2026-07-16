import { createHash, randomBytes, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type Database from "better-sqlite3";
import type {
  ActivateLicenseInput,
  CreateApiKeyInput,
  EnterpriseApiKey,
  EnterpriseBackup,
  EnterpriseDashboard,
  EnterpriseDevice,
  EnterpriseLicense,
  RegisterDeviceInput
} from "../../shared/contracts/enterprise-contracts";

type LicenseRow = { uuid:string;license_key_prefix:string;plan_code:string;status:EnterpriseLicense["status"];max_outlets:number;max_terminals:number;activated_at:string|null;expires_at:string|null;last_verified_at:string|null;updated_at:string };
type DeviceRow = { uuid:string;terminal_uuid:string|null;device_name:string;device_fingerprint:string;platform:string;app_version:string|null;status:EnterpriseDevice["status"];last_seen_at:string|null;created_at:string };
type KeyRow = { uuid:string;name:string;key_prefix:string;scopes_json:string;status:EnterpriseApiKey["status"];last_used_at:string|null;expires_at:string|null;created_at:string };
type BackupRow = { uuid:string;file_name:string;file_path:string;size_bytes:number;checksum_sha256:string|null;status:EnterpriseBackup["status"];error_message:string|null;created_at:string;completed_at:string|null };

export class EnterpriseService {
  constructor(private readonly db: Database.Database, private readonly backupRoot = path.join(process.cwd(), "backups")) {}

  dashboard(): EnterpriseDashboard {
    const license = this.getLicense();
    const devices = this.listDevices();
    const apiKeys = this.listApiKeys();
    const backups = this.listBackups();
    return { license, devices, apiKeys, backups, summary: { activeDevices: devices.filter(x=>x.status==="active").length, activeApiKeys: apiKeys.filter(x=>x.status==="active").length, readyBackups: backups.filter(x=>x.status==="ready").length, licenseConfigured: Boolean(license) } };
  }

  activateLicense(input: ActivateLicenseInput, userUuid: string): EnterpriseLicense {
    const now = new Date().toISOString();
    const hash = sha256(input.licenseKey);
    const prefix = input.licenseKey.slice(0, 6).toUpperCase();
    const existing = this.db.prepare("SELECT uuid FROM enterprise_license ORDER BY id DESC LIMIT 1").get() as {uuid:string}|undefined;
    const uuid = existing?.uuid ?? randomUUID();
    this.db.prepare(`INSERT INTO enterprise_license(uuid,license_key_hash,license_key_prefix,plan_code,status,max_outlets,max_terminals,activated_at,expires_at,last_verified_at,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(uuid) DO UPDATE SET license_key_hash=excluded.license_key_hash,license_key_prefix=excluded.license_key_prefix,plan_code=excluded.plan_code,status='active',max_outlets=excluded.max_outlets,max_terminals=excluded.max_terminals,activated_at=excluded.activated_at,expires_at=excluded.expires_at,last_verified_at=excluded.last_verified_at,updated_at=excluded.updated_at`)
      .run(uuid,hash,prefix,input.planCode,"active",input.maxOutlets,input.maxTerminals,now,input.expiresAt??null,now,now,now);
    this.event("license_activated","license",uuid,{planCode:input.planCode},userUuid);
    return this.getLicense()!;
  }

  registerDevice(input: RegisterDeviceInput, userUuid: string): EnterpriseDevice {
    const now = new Date().toISOString();
    const existing = this.db.prepare("SELECT uuid FROM enterprise_devices WHERE device_fingerprint=?").get(input.deviceFingerprint) as {uuid:string}|undefined;
    const uuid = existing?.uuid ?? randomUUID();
    this.db.prepare(`INSERT INTO enterprise_devices(uuid,terminal_uuid,device_name,device_fingerprint,platform,app_version,status,last_seen_at,created_at,updated_at)
      VALUES(?,?,?,?,?,?,'active',?,?,?) ON CONFLICT(device_fingerprint) DO UPDATE SET terminal_uuid=excluded.terminal_uuid,device_name=excluded.device_name,platform=excluded.platform,app_version=excluded.app_version,status='active',last_seen_at=excluded.last_seen_at,updated_at=excluded.updated_at`)
      .run(uuid,input.terminalUuid??null,input.deviceName,input.deviceFingerprint,input.platform,input.appVersion??null,now,now,now);
    this.event("device_registered","device",uuid,{},userUuid);
    return this.listDevices().find(x=>x.uuid===uuid)!;
  }

  revokeDevice(uuid: string, userUuid: string): EnterpriseDevice {
    const now = new Date().toISOString();
    const result = this.db.prepare("UPDATE enterprise_devices SET status='revoked',updated_at=? WHERE uuid=?").run(now,uuid);
    if (!result.changes) throw new Error("DEVICE_NOT_FOUND");
    this.event("device_revoked","device",uuid,{},userUuid);
    return this.listDevices().find(x=>x.uuid===uuid)!;
  }

  createApiKey(input: CreateApiKeyInput, userUuid: string): EnterpriseApiKey {
    const secret = `siaf_${randomBytes(24).toString("base64url")}`;
    const uuid = randomUUID();
    const now = new Date().toISOString();
    this.db.prepare(`INSERT INTO enterprise_api_keys(uuid,name,key_prefix,key_hash,scopes_json,status,expires_at,created_by_user_uuid,created_at)
      VALUES(?,?,?,?,?,'active',?,?,?)`).run(uuid,input.name,secret.slice(0,12),sha256(secret),JSON.stringify(input.scopes),input.expiresAt??null,userUuid,now);
    this.event("api_key_created","api_key",uuid,{name:input.name},userUuid);
    return {...this.listApiKeys().find(x=>x.uuid===uuid)!,secret};
  }

  revokeApiKey(uuid: string, userUuid: string): EnterpriseApiKey {
    const now = new Date().toISOString();
    const result = this.db.prepare("UPDATE enterprise_api_keys SET status='revoked',revoked_at=? WHERE uuid=?").run(now,uuid);
    if (!result.changes) throw new Error("API_KEY_NOT_FOUND");
    this.event("api_key_revoked","api_key",uuid,{},userUuid);
    return this.listApiKeys().find(x=>x.uuid===uuid)!;
  }

  async createBackup(userUuid: string): Promise<EnterpriseBackup> {
    mkdirSync(this.backupRoot,{recursive:true});
    const uuid = randomUUID();
    const now = new Date().toISOString();
    const fileName = `siafpos-${now.replace(/[:.]/g,"-")}.sqlite`;
    const filePath = path.join(this.backupRoot,fileName);
    this.db.prepare(`INSERT INTO enterprise_backups(uuid,file_name,file_path,status,created_by_user_uuid,created_at) VALUES(?,?,?,'creating',?,?)`).run(uuid,fileName,filePath,userUuid,now);
    try {
      await this.db.backup(filePath);
      const size = statSync(filePath).size;
      const checksum = sha256(readFileSync(filePath));
      const completedAt = new Date().toISOString();
      this.db.prepare("UPDATE enterprise_backups SET status='ready',size_bytes=?,checksum_sha256=?,completed_at=? WHERE uuid=?").run(size,checksum,completedAt,uuid);
      this.event("backup_created","backup",uuid,{fileName,size},userUuid);
    } catch (error) {
      this.db.prepare("UPDATE enterprise_backups SET status='failed',error_message=?,completed_at=? WHERE uuid=?").run(error instanceof Error?error.message:"Backup failed",new Date().toISOString(),uuid);
    }
    return this.listBackups().find(x=>x.uuid===uuid)!;
  }

  requestRestore(uuid: string, userUuid: string): EnterpriseBackup {
    const row = this.db.prepare("SELECT file_path,status FROM enterprise_backups WHERE uuid=?").get(uuid) as {file_path:string;status:string}|undefined;
    if (!row || row.status!=="ready" || !existsSync(row.file_path)) throw new Error("BACKUP_NOT_READY");
    this.db.prepare("UPDATE enterprise_backups SET status='restore_requested' WHERE uuid=?").run(uuid);
    this.event("restore_requested","backup",uuid,{requiresRestart:true},userUuid);
    return this.listBackups().find(x=>x.uuid===uuid)!;
  }

  private getLicense(): EnterpriseLicense|null { const r=this.db.prepare("SELECT uuid,license_key_prefix,plan_code,status,max_outlets,max_terminals,activated_at,expires_at,last_verified_at,updated_at FROM enterprise_license ORDER BY id DESC LIMIT 1").get() as LicenseRow|undefined; return r?{uuid:r.uuid,licenseKeyPrefix:r.license_key_prefix,planCode:r.plan_code,status:r.status,maxOutlets:r.max_outlets,maxTerminals:r.max_terminals,activatedAt:r.activated_at,expiresAt:r.expires_at,lastVerifiedAt:r.last_verified_at,updatedAt:r.updated_at}:null; }
  private listDevices(): EnterpriseDevice[] { return (this.db.prepare("SELECT uuid,terminal_uuid,device_name,device_fingerprint,platform,app_version,status,last_seen_at,created_at FROM enterprise_devices ORDER BY created_at DESC").all() as DeviceRow[]).map(r=>({uuid:r.uuid,terminalUuid:r.terminal_uuid,deviceName:r.device_name,deviceFingerprint:r.device_fingerprint,platform:r.platform,appVersion:r.app_version,status:r.status,lastSeenAt:r.last_seen_at,createdAt:r.created_at})); }
  private listApiKeys(): EnterpriseApiKey[] { return (this.db.prepare("SELECT uuid,name,key_prefix,scopes_json,status,last_used_at,expires_at,created_at FROM enterprise_api_keys ORDER BY created_at DESC").all() as KeyRow[]).map(r=>({uuid:r.uuid,name:r.name,keyPrefix:r.key_prefix,scopes:safeArray(r.scopes_json),status:r.status,lastUsedAt:r.last_used_at,expiresAt:r.expires_at,createdAt:r.created_at})); }
  private listBackups(): EnterpriseBackup[] { return (this.db.prepare("SELECT uuid,file_name,file_path,size_bytes,checksum_sha256,status,error_message,created_at,completed_at FROM enterprise_backups ORDER BY created_at DESC").all() as BackupRow[]).map(r=>({uuid:r.uuid,fileName:r.file_name,filePath:r.file_path,sizeBytes:r.size_bytes,checksumSha256:r.checksum_sha256,status:r.status,errorMessage:r.error_message,createdAt:r.created_at,completedAt:r.completed_at})); }
  private event(eventType:string,entityType:string,entityUuid:string,details:unknown,userUuid:string){this.db.prepare("INSERT INTO enterprise_events(uuid,event_type,entity_type,entity_uuid,details_json,created_by_user_uuid,created_at) VALUES(?,?,?,?,?,?,?)").run(randomUUID(),eventType,entityType,entityUuid,JSON.stringify(details),userUuid,new Date().toISOString());}
}
function sha256(value:string|Buffer){return createHash("sha256").update(value).digest("hex");}
function safeArray(value:string):string[]{try{const x=JSON.parse(value) as unknown;return Array.isArray(x)?x.filter((v):v is string=>typeof v==="string"):[];}catch{return[];}}
