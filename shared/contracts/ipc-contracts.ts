export type IpcError = {
  code: string;
  message: string;
  details?: unknown;
};

export type IpcResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: IpcError;
    };

export const ipcChannels = {
  systemGetAppInfo: "system:get-app-info",
  systemGetHealth: "system:get-health",
  systemGetConnectivity: "system:get-connectivity",
  databaseGetHealth: "database:get-health",
  databaseGetVersion: "database:get-version",
  authLoginPassword: "auth:login-password",
  authLoginPin: "auth:login-pin",
  authGetSession: "auth:get-session",
  authLogout: "auth:logout",
  settingsGet: "settings:get",
  settingsSet: "settings:set",
  catalogGetBootstrap: "catalog:get-bootstrap",
  catalogListCategories: "catalog:list-categories",
  catalogSearchProducts: "catalog:search-products",
  catalogGetProduct: "catalog:get-product",
  customersSearch: "customers:search",
  customersListRecent: "customers:list-recent",
  customersSave: "customers:save",
  customersSetActive: "customers:set-active",
  reportsSales: "reports:sales",
  tablesGetFloorMap: "tables:get-floor-map",
  tablesListWaiters: "tables:list-waiters",
  ordersCreateDraft: "orders:create-draft",
  ordersGetDraft: "orders:get-draft",
  ordersAddItem: "orders:add-item",
  ordersUpdateItemQuantity: "orders:update-item-quantity",
  ordersRemoveItem: "orders:remove-item",
  ordersSetItemVariant: "orders:set-item-variant",
  ordersSetItemModifiers: "orders:set-item-modifiers",
  ordersSetItemNote: "orders:set-item-note",
  ordersSetCustomer: "orders:set-customer",
  ordersSetOrderType: "orders:set-order-type",
  ordersSetTable: "orders:set-table",
  ordersSetWaiter: "orders:set-waiter",
  ordersApplyDiscount: "orders:apply-discount",
  ordersRemoveDiscount: "orders:remove-discount",
  ordersHold: "orders:hold",
  ordersListHeld: "orders:list-held",
  ordersRecallHeld: "orders:recall-held",
  ordersListRunning: "orders:list-running",
  ordersGetSummary: "orders:get-summary",
  kotPreview: "kot:preview",
  kotCreate: "kot:create",
  kotGet: "kot:get",
  kotListByOrder: "kot:list-by-order",
  kotCancel: "kot:cancel",
  kotMarkStarted: "kot:mark-started",
  kotMarkReady: "kot:mark-ready",
  kotMarkCompleted: "kot:mark-completed",
  kotReprint: "kot:reprint",
  shiftGetOpen: "shift:get-open",
  shiftOpen: "shift:open",
  shiftClose: "shift:close",
  billingPreview: "billing:preview",
  billingSettle: "billing:settle",
  billingGetByOrder: "billing:get-by-order",
  billingPrintReceipt: "billing:print-receipt",
  printersList: "printers:list",
  printersSave: "printers:save",
  printersDiagnostics: "printers:diagnostics",
  printersTest: "printers:test",
  printersOpenDrawer: "printers:open-drawer",
  printersListRoutes: "printers:list-routes",
  printersSaveRoute: "printers:save-route",
  printJobsList: "print-jobs:list",
  printJobsProcess: "print-jobs:process",
  printJobsRetry: "print-jobs:retry",
  printJobsQueueKot: "print-jobs:queue-kot",
  syncGetStatus: "sync:get-status",
  syncConfigure: "sync:configure",
  syncProcess: "sync:process",
  syncRetryFailed: "sync:retry-failed",
  inventoryDashboard: "inventory:dashboard",
  inventorySaveItem: "inventory:save-item",
  inventoryAdjust: "inventory:adjust",
  inventorySaveSupplier: "inventory:save-supplier",
  inventorySaveRecipe: "inventory:save-recipe",
  inventoryCreatePurchase: "inventory:create-purchase",
  inventoryCancelPurchase: "inventory:cancel-purchase",
  staffDashboard: "staff:dashboard",
  staffSaveEmployee: "staff:save-employee",
  staffSaveRole: "staff:save-role",
  staffCheckIn: "staff:check-in",
  staffCheckOut: "staff:check-out",
  staffSavePayroll: "staff:save-payroll"
} as const;

export type IpcChannel = (typeof ipcChannels)[keyof typeof ipcChannels];
