import { lookup } from "node:dns/promises";
import { app } from "electron";
import type { AppInfo, ConnectivityStatus, SystemHealth } from "../../shared/contracts/system-contracts";
import { appIdentity } from "../../shared/constants/app";
import { TerminalRepository } from "../repositories/terminal-repository";
import { DatabaseHealthService } from "./database-health-service";
import type Database from "better-sqlite3";

export class SystemService {
  constructor(private readonly db: Database.Database) {}

  getAppInfo(): AppInfo {
    return {
      name: appIdentity.name,
      version: app.getVersion(),
      environment: getEnvironment()
    };
  }

  async getConnectivity(): Promise<ConnectivityStatus> {
    try {
      await lookup("example.com");
      return { isOnline: true, checkedAt: new Date().toISOString() };
    } catch {
      return { isOnline: false, checkedAt: new Date().toISOString() };
    }
  }

  getHealth(): SystemHealth {
    const databaseHealth = new DatabaseHealthService(this.db).getHealth();
    const terminal = new TerminalRepository(this.db).findFirst();
    const terminalReady = Boolean(terminal && terminal.registration_status === "registered");
    const now = new Date().toISOString();

    return {
      status: databaseHealth.status === "ok" && terminalReady ? "ok" : "warning",
      app: {
        name: "Application",
        status: "ok",
        message: "Electron application is running."
      },
      database: {
        name: "SQLite",
        status: databaseHealth.status,
        message: databaseHealth.message
      },
      migrations: {
        name: "Migrations",
        status: databaseHealth.requiredTablesPresent ? "ok" : "error",
        message: databaseHealth.requiredTablesPresent ? "Required tables are present." : "Required tables are missing."
      },
      terminal: {
        name: "Terminal",
        status: terminalReady ? "ok" : "warning",
        message: terminalReady ? `${terminal?.name ?? "Terminal"} is registered.` : "Terminal is not registered."
      },
      renderer: {
        name: "Renderer",
        status: "ok",
        message: "Renderer can request system health."
      },
      checkedAt: now
    };
  }
}

function getEnvironment(): AppInfo["environment"] {
  if (process.env.NODE_ENV === "test") {
    return "test";
  }
  return app.isPackaged ? "production" : "development";
}
