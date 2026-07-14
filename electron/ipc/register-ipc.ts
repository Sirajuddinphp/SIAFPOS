import type Database from "better-sqlite3";
import { registerAuthIpc } from "./auth-ipc";
import { registerCatalogIpc } from "./catalog-ipc";
import { registerCustomerIpc } from "./customer-ipc";
import { registerDatabaseIpc } from "./database-ipc";
import { registerKotIpc } from "./kot-ipc";
import { registerOrderIpc } from "./order-ipc";
import { registerSettingsIpc } from "./settings-ipc";
import { registerSystemIpc } from "./system-ipc";
import { registerTableIpc } from "./table-ipc";
import { registerShiftIpc } from "./shift-ipc";
import { registerBillingIpc } from "./billing-ipc";
import { registerPrinterIpc } from "./printer-ipc";

let registered = false;

export function registerIpc(db: Database.Database): void {
  if (registered) {
    return;
  }

  registerSystemIpc(db);
  registerDatabaseIpc(db);
  registerAuthIpc(db);
  registerSettingsIpc(db);
  registerCatalogIpc(db);
  registerCustomerIpc(db);
  registerTableIpc(db);
  registerOrderIpc(db);
  registerKotIpc(db);
  registerShiftIpc(db);
  registerBillingIpc(db);
  registerPrinterIpc(db);
  registered = true;
}
