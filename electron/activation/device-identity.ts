import { createHash, randomUUID } from "node:crypto";
import os from "node:os";
import Store from "electron-store";
import { app } from "electron";

type DeviceIdentityStore = { deviceUuid?: string };

const store = new Store<DeviceIdentityStore>({ name: "device-identity", clearInvalidConfig: true });

export type DeviceIdentity = {
  deviceUuid: string;
  machineFingerprint: string;
  windowsUsername: string;
  computerName: string;
  appVersion: string;
};

export function getDeviceIdentity(): DeviceIdentity {
  let deviceUuid = store.get("deviceUuid");
  if (!deviceUuid) {
    deviceUuid = randomUUID();
    store.set("deviceUuid", deviceUuid);
  }

  const windowsUsername = safeUsername();
  const computerName = os.hostname();
  const fingerprintSource = [os.platform(), os.arch(), computerName, windowsUsername, os.cpus()[0]?.model ?? "unknown"].join("|");

  return {
    deviceUuid,
    machineFingerprint: createHash("sha256").update(fingerprintSource).digest("hex"),
    windowsUsername,
    computerName,
    appVersion: app?.getVersion?.() ?? process.env.npm_package_version ?? "0.1.0"
  };
}

function safeUsername(): string {
  try {
    return os.userInfo().username;
  } catch {
    return process.env.USERNAME ?? "unknown";
  }
}
