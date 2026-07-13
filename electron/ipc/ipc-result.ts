import type { IpcResult } from "../../shared/contracts/ipc-contracts";

export function ok<T>(data: T): IpcResult<T> {
  return { success: true, data };
}

export function fail<T = never>(code: string, message: string, details?: unknown): IpcResult<T> {
  return {
    success: false,
    error: {
      code,
      message,
      details
    }
  };
}

export function toSafeError(error: unknown): { code: string; message: string; details?: unknown } {
  if (error instanceof Error) {
    return {
      code: "UNKNOWN_INTERNAL_ERROR",
      message: "An internal error occurred.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    };
  }

  return {
    code: "UNKNOWN_INTERNAL_ERROR",
    message: "An internal error occurred."
  };
}
