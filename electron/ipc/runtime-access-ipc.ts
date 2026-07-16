import { ipcMain } from "electron";
import { ipcChannels } from "../../shared/contracts/ipc-contracts";
import type { RuntimeAccessState, RuntimeRegistrationInput, RuntimeStatus } from "../../shared/contracts/runtime-access-contracts";
import {
  activateYearly,
  clearRuntimeAccess,
  getCachedRuntimeStatus,
  RuntimeAccessError,
  startTrial,
  verifyRuntimeAccess
} from "../activation/runtime-service";
import { fail, ok } from "./ipc-result";

export function registerRuntimeAccessIpc(): void {
  ipcMain.handle(ipcChannels.runtimeGetStatus, () => ok(sanitizeStatus(getCachedRuntimeStatus())));
  ipcMain.handle(ipcChannels.runtimeStartTrial, async (_event, input: RuntimeRegistrationInput) => handleState(() => startTrial(input)));
  ipcMain.handle(ipcChannels.runtimeActivateYearly, async (_event, input: RuntimeRegistrationInput) => handleState(() => activateYearly(input)));
  ipcMain.handle(ipcChannels.runtimeVerify, async () => handleStatus(verifyRuntimeAccess));
  ipcMain.handle(ipcChannels.runtimeClear, () => {
    clearRuntimeAccess();
    return ok({ cleared: true as const });
  });
}

async function handleState(callback: () => Promise<RuntimeAccessState>) {
  return handle(async () => sanitizeState(await callback()));
}

async function handleStatus(callback: () => Promise<RuntimeStatus>) {
  return handle(async () => sanitizeStatus(await callback()));
}

function sanitizeStatus(status: RuntimeStatus): RuntimeStatus {
  return { ...status, state: status.state ? sanitizeState(status.state) : null };
}

function sanitizeState(state: RuntimeAccessState): RuntimeAccessState {
  const { token: _token, ...safe } = state;
  return safe;
}

async function handle<T>(callback: () => Promise<T>) {
  try {
    return ok(await callback());
  } catch (error) {
    if (error instanceof RuntimeAccessError) return fail(error.code, error.message, { status: error.status });
    return fail("RUNTIME_ACCESS_FAILED", error instanceof Error ? error.message : "Runtime access request failed.");
  }
}
