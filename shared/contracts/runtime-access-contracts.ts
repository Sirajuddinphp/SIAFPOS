export type RuntimeMode = "trial" | "paid";

export type RuntimeDeviceIdentity = {
  uuid: string;
  machineFingerprint: string;
  windowsUsername: string | null;
  computerName: string | null;
  appVersion: string;
};

export type RuntimeRegistrationInput = {
  restaurantCode: string;
  ownerEmail: string;
  ownerMobile: string;
  licenseKey?: string;
};

export type RuntimeAccessState = {
  allowed: boolean;
  mode: RuntimeMode | null;
  code?: string;
  message?: string;
  token?: string;
  tokenType?: string;
  tokenExpiresIn?: number;
  offlineGraceHours: number;
  tenantUuid?: string;
  restaurantUuid?: string;
  deviceUuid?: string;
  licenseUuid?: string;
  accessExpiresAt?: string;
  verifiedAt?: string;
  lastOnlineVerifiedAt?: string;
  configuration?: {
    restaurantName: string;
    timezone: string;
    currency: string;
    locale: string;
    features: Record<string, boolean>;
  };
};

export type RuntimeStatus = {
  state: RuntimeAccessState | null;
  requiresActivation: boolean;
  offline: boolean;
};
