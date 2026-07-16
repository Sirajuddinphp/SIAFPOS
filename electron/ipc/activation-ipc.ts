import { ipcMain } from "electron";
import { ipcChannels } from "../../shared/contracts/ipc-contracts";
import { activateDeviceSchema } from "../../shared/schemas/activation-schemas";
import { activateDevice, ActivationError, getActivationState } from "../activation/activation-service";
import { fail, ok } from "./ipc-result";

export function registerActivationIpc(): void {
  ipcMain.handle(ipcChannels.activationGetState, () => ok(getActivationState()));
  ipcMain.handle(ipcChannels.activationActivate, async (_event, input: unknown) => {
    try {
      return ok(await activateDevice(activateDeviceSchema.parse(input)));
    } catch (error: unknown) {
      if (error instanceof ActivationError) return fail(error.code, error.message, { status: error.status });
      return fail("ACTIVATION_FAILED", "Activation failed.");
    }
  });
}
