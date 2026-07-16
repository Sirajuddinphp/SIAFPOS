import type {
  ActivateDeviceInput,
  ActivationRecord,
  ActivationState
} from "../../shared/contracts/activation-contracts";
import { activateDeviceSchema, cloudActivationResponseSchema } from "../../shared/schemas/activation-schemas";
import { getDeviceIdentity } from "./device-identity";
import { getActivationRecord, saveActivationRecord } from "./activation-store";

const DEFAULT_API_URL = "https://siafpos.siafinfoweb.com/api/v1";
const ACTIVATION_TIMEOUT_MS = 15_000;

type ActivationErrorPayload = {
  error?: { code?: string; message?: string };
  code?: string;
  message?: string;
};

export class ActivationError extends Error {
  constructor(public readonly code: string, message: string, public readonly status?: number) {
    super(message);
    this.name = "ActivationError";
    Object.setPrototypeOf(this, ActivationError.prototype);
  }
}

export async function activateDevice(input: ActivateDeviceInput): Promise<ActivationState> {
  const validated = activateDeviceSchema.parse(input);
  const identity = getDeviceIdentity();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ACTIVATION_TIMEOUT_MS);

  try {
    const apiUrl = (process.env.MEALHI5_CLOUD_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, "");
    const response = await fetch(`${apiUrl}/activation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-App-Version": identity.appVersion
      },
      body: JSON.stringify({
        restaurant_code: validated.restaurantCode,
        license_key: validated.licenseKey,
        owner_email: validated.ownerEmail,
        owner_mobile: validated.ownerMobile,
        device: {
          uuid: identity.deviceUuid,
          machine_fingerprint: identity.machineFingerprint,
          windows_username: identity.windowsUsername,
          computer_name: identity.computerName,
          app_version: identity.appVersion
        }
      }),
      signal: controller.signal
    });

    const payload = await readJsonPayload(response);
    if (!response.ok) {
      const errorPayload = getActivationErrorPayload(payload);
      throw new ActivationError(
        errorPayload.error?.code ?? errorPayload.code ?? "ACTIVATION_FAILED",
        errorPayload.error?.message ?? errorPayload.message ?? `Activation failed with status ${response.status}.`,
        response.status
      );
    }

    const parsed = cloudActivationResponseSchema.parse(payload);
    const now = new Date().toISOString();
    const record: ActivationRecord = {
      status: "activated",
      activatedAt: parsed.data.activatedAt,
      lastVerifiedAt: now,
      deviceUuid: parsed.data.deviceUuid,
      tenantUuid: parsed.data.tenantUuid,
      restaurantUuid: parsed.data.restaurantUuid,
      jwt: parsed.data.token,
      configuration: parsed.data.configuration
    };

    saveActivationRecord(record);
    return toActivationState(record);
  } catch (error: unknown) {
    if (error instanceof ActivationError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ActivationError("ACTIVATION_TIMEOUT", "Cloud activation timed out. Check your internet connection and try again.");
    }
    if (error instanceof Error && error.name === "ZodError") {
      throw new ActivationError("INVALID_ACTIVATION_RESPONSE", "The cloud activation response was invalid.");
    }
    throw new ActivationError("CLOUD_UNREACHABLE", "Cloud activation service is unreachable. Internet is required for first activation.");
  } finally {
    clearTimeout(timeout);
  }
}

export function getActivationState(): ActivationState {
  return toActivationState(getActivationRecord());
}

async function readJsonPayload(response: Response): Promise<unknown> {
  try { return await response.json(); } catch { return null; }
}

function getActivationErrorPayload(payload: unknown): ActivationErrorPayload {
  return payload && typeof payload === "object" ? payload as ActivationErrorPayload : {};
}

function toActivationState(record: ActivationRecord | null): ActivationState {
  if (!record) return { status: "not_activated", activated: false, record: null };
  const { jwt: _jwt, ...safeRecord } = record;
  return { status: record.status, activated: record.status === "activated", record: safeRecord };
}
