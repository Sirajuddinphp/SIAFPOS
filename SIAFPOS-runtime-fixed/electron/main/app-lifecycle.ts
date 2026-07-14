import { app } from "electron";
import { closeDatabase } from "../database/connection";
import { getMainWindow, createMainWindow } from "./window-manager";
import { logger } from "../logger/logger";

export function configureAppLifecycle(): void {
  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    logger.warn("application", "Single instance lock not acquired; quitting duplicate instance");
    app.quit();
    return;
  }

  app.on("second-instance", () => {
    const window = getMainWindow();
    if (!window) {
      return;
    }
    if (window.isMinimized()) {
      window.restore();
    }
    window.focus();
  });

  app.on("activate", () => {
    if (!getMainWindow()) {
      createMainWindow();
    }
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("before-quit", () => {
    closeDatabase();
    logger.info("application", "Application quitting");
  });
}
