export type LicenseStatus = "trial" | "active" | "expired" | "suspended" | "revoked";
export type DeviceStatus = "active" | "revoked" | "blocked";

export type EnterpriseLicense = {
  uuid: string;
  licenseKeyPrefix: string;
  planCode: string;
  status: LicenseStatus;
  maxOutlets: number;
  maxTerminals: number;
  activatedAt: string | null;
  expiresAt: string | null;
  lastVerifiedAt: string | null;
  updatedAt: string;
};

export type EnterpriseDevice = {
  uuid: string;
  terminalUuid: string | null;
  deviceName: string;
  deviceFingerprint: string;
  platform: string;
  appVersion: string | null;
  status: DeviceStatus;
  lastSeenAt: string | null;
  createdAt: string;
};

export type EnterpriseApiKey = {
  uuid: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  status: "active" | "revoked";
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  secret?: string;
};

export type EnterpriseBackup = {
  uuid: string;
  fileName: string;
  filePath: string;
  sizeBytes: number;
  checksumSha256: string | null;
  status: "creating" | "ready" | "failed" | "restore_requested" | "restored";
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type EnterpriseDashboard = {
  license: EnterpriseLicense | null;
  devices: EnterpriseDevice[];
  apiKeys: EnterpriseApiKey[];
  backups: EnterpriseBackup[];
  summary: {
    activeDevices: number;
    activeApiKeys: number;
    readyBackups: number;
    licenseConfigured: boolean;
  };
};

export type ActivateLicenseInput = {
  licenseKey: string;
  planCode: string;
  maxOutlets: number;
  maxTerminals: number;
  expiresAt?: string | null;
};

export type RegisterDeviceInput = {
  terminalUuid?: string | null;
  deviceName: string;
  deviceFingerprint: string;
  platform: string;
  appVersion?: string | null;
};

export type CreateApiKeyInput = {
  name: string;
  scopes: string[];
  expiresAt?: string | null;
};
