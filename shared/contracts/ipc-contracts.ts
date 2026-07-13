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
  billingPrintReceipt: "billing:print-receipt"
} as const;

export type IpcChannel = (typeof ipcChannels)[keyof typeof ipcChannels];
