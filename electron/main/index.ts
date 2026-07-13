import { app, dialog } from "electron";
import { initializeDatabase } from "../database/connection";
import { runMigrations } from "../database/migration-runner";
import { seedDevelopmentData } from "../database/seeders/development-seeder";
import { registerIpc } from "../ipc/register-ipc";
import { logger } from "../logger/logger";
import { configureAppLifecycle } from "./app-lifecycle";
import { createMainWindow } from "./window-manager";

process.on("uncaughtException", (error) => {
  logger.error("application", "Uncaught exception", error);
});

process.on("unhandledRejection", (reason) => {
  logger.error("application", "Unhandled rejection", reason);
});

configureAppLifecycle();

void app.whenReady().then(async () => {
  try {
    logger.info("application", "Application startup");
    const db = initializeDatabase();
    runMigrations(db);
    seedDevelopmentData(db);
    registerIpc(db);
    createMainWindow();
  } catch (error) {
    logger.error("application", "Startup failed", error);
    dialog.showErrorBox("MealHi5 POS startup failed", "The application could not start. Please check logs or contact support.");
    app.quit();
  }
});
