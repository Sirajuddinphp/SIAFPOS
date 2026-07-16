export type ActivationStatus = "not_activated" | "activated" | "suspended" | "revoked" | "expired";

export type ActivateDeviceInput = {
  restaurantCode: string;
  licenseKey: string;
  ownerEmail: string;
  ownerMobile: string;
};

export type ActivationConfiguration = {
  restaurantName?: string;
  planCode?: string;
  expiresAt?: string | null;
  features?: Record<string, boolean>;
  limits?: Record<string, number>;
};

export type ActivationRecord = {
  status: Exclude<ActivationStatus, "not_activated">;
  activatedAt: string;
  lastVerifiedAt: string;
  deviceUuid: string;
  tenantUuid: string;
  restaurantUuid: string;
  jwt: string;
  configuration: ActivationConfiguration;
};

export type SafeActivationRecord = Omit<ActivationRecord, "jwt">;

export type ActivationState = {
  status: ActivationStatus;
  activated: boolean;
  record: SafeActivationRecord | null;
};
