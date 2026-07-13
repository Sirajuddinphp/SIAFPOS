import type { PosApi } from "@shared/types/global";

const preloadUnavailableMessage =
  "Desktop bridge is unavailable. If this page is open in a normal browser tab, close it and use the Electron app window. If you are already in the Electron window, restart the app so the preload script can load correctly.";

export function getPosApi(): PosApi | null {
  return typeof window !== "undefined" && window.pos ? window.pos : null;
}

export function requirePosApi(): PosApi {
  const api = getPosApi();
  if (!api) {
    throw new Error(preloadUnavailableMessage);
  }

  return api;
}

export function getPreloadUnavailableMessage(): string {
  return preloadUnavailableMessage;
}

export function isElectronRenderer(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return navigator.userAgent.toLowerCase().includes("electron");
}
