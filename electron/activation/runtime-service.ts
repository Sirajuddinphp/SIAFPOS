import type {
  RuntimeAccessState,
  RuntimeRegistrationInput,
  RuntimeStatus
} from "../../shared/contracts/runtime-access-contracts";
import { getDeviceIdentity } from "./device-identity";
import { clearRuntimeState, getRuntimeState, saveRuntimeState } from "./runtime-store";

const API_BASE_URL = (process.env.MEALHI5_CLOUD_API_URL ?? "https://siafpos.siafinfoweb.com/api/v1").replace(/\/+$/, "");
const REQUEST_TIMEOUT_MS = 15_000;

type CloudPayload = {
  data?: {
    allowed: boolean;
    mode?: "trial" | "paid";
    code?: string;
    message?: string;
    token?: string;
    token_type?: string;
    token_expires_in?: number;
    offline_grace_hours?: number;
    tenant_uuid?: string;
    restaurant_uuid?: string;
    device_uuid?: string;
    license_uuid?: string;
    access_expires_at?: string;
    verified_at?: string;
    configuration?: {
      restaurant_name: string;
      timezone: string;
      currency: string;
      locale: string;
      features: Record<string, boolean>;
    };
  };
  message?: string;
  error?: { code?: string; message?: string };
};

export class RuntimeAccessError extends Error {
  constructor(public readonly code: string, message: string, public readonly status?: number) {
    super(message);
    this.name = "RuntimeAccessError";
  }
}

function normalize(payload: NonNullable<CloudPayload["data"]>, previous?: RuntimeAccessState | null): RuntimeAccessState {
  return {
    allowed: payload.allowed,
    mode: payload.mode ?? previous?.mode ?? null,
    code: payload.code,
    message: payload.message,
    token: payload.token ?? previous?.token,
    tokenType: payload.token_type ?? previous?.tokenType ?? "Bearer",
    tokenExpiresIn: payload.token_expires_in ?? previous?.tokenExpiresIn,
    offlineGraceHours: payload.offline_grace_hours ?? previous?.offlineGraceHours ?? 48,
    tenantUuid: payload.tenant_uuid ?? previous?.tenantUuid,
    restaurantUuid: payload.restaurant_uuid ?? previous?.restaurantUuid,
    deviceUuid: payload.device_uuid ?? previous?.deviceUuid,
    licenseUuid: payload.license_uuid ?? previous?.licenseUuid,
    accessExpiresAt: payload.access_expires_at ?? previous?.accessExpiresAt,
    verifiedAt: payload.verified_at,
    lastOnlineVerifiedAt: payload.allowed ? (payload.verified_at ?? new Date().toISOString()) : previous?.lastOnlineVerifiedAt,
    configuration: payload.configuration
      ? {
          restaurantName: payload.configuration.restaurant_name,
          timezone: payload.configuration.timezone,
          currency: payload.configuration.currency,
          locale: payload.configuration.locale,
          features: payload.configuration.features
        }
      : previous?.configuration
  };
}

async function request(path: string, init: RequestInit): Promise<NonNullable<CloudPayload["data"]>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(init.headers ?? {})
      }
    });

    let payload: CloudPayload = {};
    try {
      payload = (await response.json()) as CloudPayload;
    } catch {
      payload = {};
    }

    if (!response.ok || !payload.data) {
      throw new RuntimeAccessError(
        payload.error?.code ?? "RUNTIME_REQUEST_FAILED",
        payload.error?.message ?? payload.message ?? payload.data?.message ?? `Cloud request failed (${response.status}).`,
        response.status
      );
    }

    return payload.data;
  } catch (error) {
    if (error instanceof RuntimeAccessError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new RuntimeAccessError("RUNTIME_TIMEOUT", "Runtime verification timed out.");
    }
    throw new RuntimeAccessError("RUNTIME_UNREACHABLE", "Runtime access service is unreachable.");
  } finally {
    clearTimeout(timeout);
  }
}

export async function startTrial(input: RuntimeRegistrationInput): Promise<RuntimeAccessState> {
  const data = await request("/runtime/trial/start", {
    method: "POST",
    body: JSON.stringify({
      restaurant_code: input.restaurantCode,
      owner_email: input.ownerEmail,
      owner_mobile: input.ownerMobile,
      device: toCloudDevice()
    })
  });
  const state = normalize(data);
  saveRuntimeState(state);
  return state;
}

export async function activateYearly(input: RuntimeRegistrationInput): Promise<RuntimeAccessState> {
  if (!input.licenseKey?.trim()) throw new RuntimeAccessError("LICENSE_REQUIRED", "License key is required.");
  const data = await request("/runtime/yearly/activate", {
    method: "POST",
    body: JSON.stringify({
      restaurant_code: input.restaurantCode,
      license_key: input.licenseKey,
      owner_email: input.ownerEmail,
      owner_mobile: input.ownerMobile,
      device: toCloudDevice()
    })
  });
  const state = normalize(data);
  saveRuntimeState(state);
  return state;
}

export async function verifyRuntimeAccess(): Promise<RuntimeStatus> {
  const stored = getRuntimeState();
  if (!stored?.token) return { state: stored, requiresActivation: true, offline: false };

  try {
    const data = await request("/runtime/verify", {
      method: "GET",
      headers: { Authorization: `${stored.tokenType ?? "Bearer"} ${stored.token}` }
    });
    const state = normalize(data, stored);
    saveRuntimeState(state);
    return { state, requiresActivation: !state.allowed || isAccessExpired(state), offline: false };
  } catch (error) {
    if (!isOfflineGraceValid(stored)) {
      return {
        state: {
          ...stored,
          allowed: false,
          code: "OFFLINE_GRACE_EXPIRED",
          message: error instanceof Error ? error.message : "Runtime verification failed."
        },
        requiresActivation: true,
        offline: true
      };
    }
    return { state: stored, requiresActivation: false, offline: true };
  }
}

export function getCachedRuntimeStatus(): RuntimeStatus {
  const state = getRuntimeState();
  return { state, requiresActivation: !state?.allowed || isAccessExpired(state), offline: false };
}

export function clearRuntimeAccess(): void {
  clearRuntimeState();
}

function toCloudDevice() {
  const device = getDeviceIdentity();
  return {
    uuid: device.deviceUuid,
    machine_fingerprint: device.machineFingerprint,
    windows_username: device.windowsUsername,
    computer_name: device.computerName,
    app_version: device.appVersion
  };
}

function isAccessExpired(state: RuntimeAccessState): boolean {
  if (!state.accessExpiresAt) return false;
  return new Date(state.accessExpiresAt).getTime() <= Date.now();
}

function isOfflineGraceValid(state: RuntimeAccessState): boolean {
  if (!state.allowed || isAccessExpired(state) || !state.lastOnlineVerifiedAt) return false;
  return Date.now() - new Date(state.lastOnlineVerifiedAt).getTime() <= state.offlineGraceHours * 60 * 60 * 1000;
}
