import { getActivationRecord } from "../activation/activation-store";

export function assertActivated(): void {
  const record = getActivationRecord();

  if (!record || record.status !== "activated") {
    const error = new Error("Desktop POS activation is required.") as Error & {
      code: string;
    };

    error.code = "ACTIVATION_REQUIRED";

    throw error;
  }
}