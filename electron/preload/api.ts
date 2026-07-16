import { ipcRenderer } from "electron";
import type { PosApi } from "../../shared/types/global";

// Sandboxed preload scripts cannot require arbitrary project modules at runtime,
// so the channel map used here must stay local to the preload bundle.
const ipcChannels = {
  systemGetAppInfo: "system:get-app-info",
  systemGetHealth: "system:get-health",
  systemGetConnectivity: "system:get-connectivity",
  activationGetState: "activation:get-state",
  activationActivate: "activation:activate",
  runtimeGetStatus: "runtime:get-status",
  runtimeStartTrial: "runtime:start-trial",
  runtimeActivateYearly: "runtime:activate-yearly",
  runtimeVerify: "runtime:verify",
  runtimeClear: "runtime:clear",
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
  crmDashboard: "crm:dashboard",
  crmAdjust: "crm:adjust",
  crmSaveCoupon: "crm:save-coupon",
  crmSaveMembership: "crm:save-membership",
  onlineDashboard: "online:dashboard",
  onlineSaveChannel: "online:save-channel",
  onlineGenerateQr: "online:generate-qr",
  onlineCreateOrder: "online:create-order",
  onlineUpdateStatus: "online:update-status",
  printersList: "printers:list", printersSave: "printers:save", printersDiagnostics: "printers:diagnostics", printersTest: "printers:test", printersOpenDrawer: "printers:open-drawer", printersListRoutes: "printers:list-routes", printersSaveRoute: "printers:save-route", printJobsList: "print-jobs:list", printJobsProcess: "print-jobs:process", printJobsRetry: "print-jobs:retry", printJobsQueueKot: "print-jobs:queue-kot", syncGetStatus: "sync:get-status", syncConfigure: "sync:configure", syncProcess: "sync:process", syncRetryFailed: "sync:retry-failed", inventoryDashboard:"inventory:dashboard", inventorySaveItem:"inventory:save-item", inventoryAdjust:"inventory:adjust", inventorySaveSupplier:"inventory:save-supplier", inventorySaveRecipe:"inventory:save-recipe", inventoryCreatePurchase:"inventory:create-purchase", inventoryCancelPurchase:"inventory:cancel-purchase", staffDashboard:"staff:dashboard", staffSaveEmployee:"staff:save-employee", staffSaveRole:"staff:save-role", staffCheckIn:"staff:check-in", staffCheckOut:"staff:check-out", staffSavePayroll:"staff:save-payroll", menuDashboard:"menu:dashboard", menuSaveCategory:"menu:save-category", menuSaveProduct:"menu:save-product", menuSaveVariant:"menu:save-variant", menuSaveModifierGroup:"menu:save-modifier-group", menuSaveModifier:"menu:save-modifier", menuAssignModifierGroup:"menu:assign-modifier-group", outletsDashboard:"outlets:dashboard", outletsSave:"outlets:save", outletsCreateTransfer:"outlets:create-transfer", outletsSendTransfer:"outlets:send-transfer", outletsReceiveTransfer:"outlets:receive-transfer", outletsSeedBalance:"outlets:seed-balance", accountingDashboard:"accounting:dashboard", accountingSaveAccount:"accounting:save-account", accountingCreateEntry:"accounting:create-entry", enterpriseDashboard:"enterprise:dashboard", enterpriseActivateLicense:"enterprise:activate-license", enterpriseRegisterDevice:"enterprise:register-device", enterpriseRevokeDevice:"enterprise:revoke-device", enterpriseCreateApiKey:"enterprise:create-api-key", enterpriseRevokeApiKey:"enterprise:revoke-api-key", enterpriseCreateBackup:"enterprise:create-backup", enterpriseRequestRestore:"enterprise:request-restore",
} as const;

export const posApi: PosApi = {
  runtime: {
    getStatus: () => ipcRenderer.invoke(ipcChannels.runtimeGetStatus),
    startTrial: (input) => ipcRenderer.invoke(ipcChannels.runtimeStartTrial, input),
    activateYearly: (input) => ipcRenderer.invoke(ipcChannels.runtimeActivateYearly, input),
    verify: () => ipcRenderer.invoke(ipcChannels.runtimeVerify),
    clear: () => ipcRenderer.invoke(ipcChannels.runtimeClear)
  },
  system: {
    getAppInfo: () => ipcRenderer.invoke(ipcChannels.systemGetAppInfo),
    getHealth: () => ipcRenderer.invoke(ipcChannels.systemGetHealth),
    getConnectivity: () => ipcRenderer.invoke(ipcChannels.systemGetConnectivity)
  },
  activation: {
    getState: () => ipcRenderer.invoke(ipcChannels.activationGetState),
    activate: (input) => ipcRenderer.invoke(ipcChannels.activationActivate, input)
  },
  database: {
    getHealth: () => ipcRenderer.invoke(ipcChannels.databaseGetHealth),
    getVersion: () => ipcRenderer.invoke(ipcChannels.databaseGetVersion)
  },
  auth: {
    loginWithPassword: (input) => ipcRenderer.invoke(ipcChannels.authLoginPassword, input),
    loginWithPin: (input) => ipcRenderer.invoke(ipcChannels.authLoginPin, input),
    getSession: () => ipcRenderer.invoke(ipcChannels.authGetSession),
    logout: () => ipcRenderer.invoke(ipcChannels.authLogout)
  },
  settings: {
    get: (input) => ipcRenderer.invoke(ipcChannels.settingsGet, input),
    set: (input) => ipcRenderer.invoke(ipcChannels.settingsSet, input)
  },
  catalog: {
    getBootstrap: () => ipcRenderer.invoke(ipcChannels.catalogGetBootstrap),
    listCategories: () => ipcRenderer.invoke(ipcChannels.catalogListCategories),
    searchProducts: (input) => ipcRenderer.invoke(ipcChannels.catalogSearchProducts, input),
    getProduct: (input) => ipcRenderer.invoke(ipcChannels.catalogGetProduct, input)
  },
  customers: {
    search: (input) => ipcRenderer.invoke(ipcChannels.customersSearch, input),
    listRecent: () => ipcRenderer.invoke(ipcChannels.customersListRecent),
    save: (input) => ipcRenderer.invoke(ipcChannels.customersSave, input),
    setActive: (input) => ipcRenderer.invoke(ipcChannels.customersSetActive, input)
  },
  tables: {
    getFloorMap: () => ipcRenderer.invoke(ipcChannels.tablesGetFloorMap),
    listWaiters: () => ipcRenderer.invoke(ipcChannels.tablesListWaiters)
  },
  orders: {
    createDraft: (input) => ipcRenderer.invoke(ipcChannels.ordersCreateDraft, input),
    getDraft: (input) => ipcRenderer.invoke(ipcChannels.ordersGetDraft, input),
    addItem: (input) => ipcRenderer.invoke(ipcChannels.ordersAddItem, input),
    updateItemQuantity: (input) => ipcRenderer.invoke(ipcChannels.ordersUpdateItemQuantity, input),
    removeItem: (input) => ipcRenderer.invoke(ipcChannels.ordersRemoveItem, input),
    setItemVariant: (input) => ipcRenderer.invoke(ipcChannels.ordersSetItemVariant, input),
    setItemModifiers: (input) => ipcRenderer.invoke(ipcChannels.ordersSetItemModifiers, input),
    setItemNote: (input) => ipcRenderer.invoke(ipcChannels.ordersSetItemNote, input),
    setCustomer: (input) => ipcRenderer.invoke(ipcChannels.ordersSetCustomer, input),
    setOrderType: (input) => ipcRenderer.invoke(ipcChannels.ordersSetOrderType, input),
    setTable: (input) => ipcRenderer.invoke(ipcChannels.ordersSetTable, input),
    setWaiter: (input) => ipcRenderer.invoke(ipcChannels.ordersSetWaiter, input),
    applyDiscount: (input) => ipcRenderer.invoke(ipcChannels.ordersApplyDiscount, input),
    removeDiscount: (input) => ipcRenderer.invoke(ipcChannels.ordersRemoveDiscount, input),
    hold: (input) => ipcRenderer.invoke(ipcChannels.ordersHold, input),
    listHeld: () => ipcRenderer.invoke(ipcChannels.ordersListHeld),
    recallHeld: (input) => ipcRenderer.invoke(ipcChannels.ordersRecallHeld, input),
    listRunning: () => ipcRenderer.invoke(ipcChannels.ordersListRunning),
    getSummary: (input) => ipcRenderer.invoke(ipcChannels.ordersGetSummary, input)
  },
  shift: { getOpen:()=>ipcRenderer.invoke(ipcChannels.shiftGetOpen), open:(input)=>ipcRenderer.invoke(ipcChannels.shiftOpen,input), close:(input)=>ipcRenderer.invoke(ipcChannels.shiftClose,input) },
  billing: { preview:(input)=>ipcRenderer.invoke(ipcChannels.billingPreview,input), settle:(input)=>ipcRenderer.invoke(ipcChannels.billingSettle,input), getByOrder:(input)=>ipcRenderer.invoke(ipcChannels.billingGetByOrder,input), printReceipt:(input)=>ipcRenderer.invoke(ipcChannels.billingPrintReceipt,input) },
  printers: { list:()=>ipcRenderer.invoke(ipcChannels.printersList), save:(input)=>ipcRenderer.invoke(ipcChannels.printersSave,input), diagnostics:(input)=>ipcRenderer.invoke(ipcChannels.printersDiagnostics,input), test:(input)=>ipcRenderer.invoke(ipcChannels.printersTest,input), openDrawer:(input)=>ipcRenderer.invoke(ipcChannels.printersOpenDrawer,input), listRoutes:()=>ipcRenderer.invoke(ipcChannels.printersListRoutes), saveRoute:(input)=>ipcRenderer.invoke(ipcChannels.printersSaveRoute,input) },
  printJobs: { list:()=>ipcRenderer.invoke(ipcChannels.printJobsList), process:()=>ipcRenderer.invoke(ipcChannels.printJobsProcess), retry:(input)=>ipcRenderer.invoke(ipcChannels.printJobsRetry,input), queueKot:(input)=>ipcRenderer.invoke(ipcChannels.printJobsQueueKot,input) },
  sync: { getStatus:()=>ipcRenderer.invoke(ipcChannels.syncGetStatus), configure:(input)=>ipcRenderer.invoke(ipcChannels.syncConfigure,input), process:()=>ipcRenderer.invoke(ipcChannels.syncProcess), retryFailed:()=>ipcRenderer.invoke(ipcChannels.syncRetryFailed) },
  reports: { sales:(input)=>ipcRenderer.invoke(ipcChannels.reportsSales,input) },
  inventory: { dashboard:()=>ipcRenderer.invoke(ipcChannels.inventoryDashboard), saveItem:(input)=>ipcRenderer.invoke(ipcChannels.inventorySaveItem,input), adjust:(input)=>ipcRenderer.invoke(ipcChannels.inventoryAdjust,input), saveSupplier:(input)=>ipcRenderer.invoke(ipcChannels.inventorySaveSupplier,input), saveRecipe:(input)=>ipcRenderer.invoke(ipcChannels.inventorySaveRecipe,input), createPurchase:(input)=>ipcRenderer.invoke(ipcChannels.inventoryCreatePurchase,input), cancelPurchase:(input)=>ipcRenderer.invoke(ipcChannels.inventoryCancelPurchase,input) },
  staff: { dashboard:()=>ipcRenderer.invoke(ipcChannels.staffDashboard), saveEmployee:(input)=>ipcRenderer.invoke(ipcChannels.staffSaveEmployee,input), saveRole:(input)=>ipcRenderer.invoke(ipcChannels.staffSaveRole,input), checkIn:(input)=>ipcRenderer.invoke(ipcChannels.staffCheckIn,input), checkOut:(input)=>ipcRenderer.invoke(ipcChannels.staffCheckOut,input), savePayroll:(input)=>ipcRenderer.invoke(ipcChannels.staffSavePayroll,input) },
  crm: {
    dashboard: () =>
      ipcRenderer.invoke(ipcChannels.crmDashboard),

    adjust: (input) =>
      ipcRenderer.invoke(ipcChannels.crmAdjust, input),

    saveCoupon: (input) =>
      ipcRenderer.invoke(ipcChannels.crmSaveCoupon, input),

    saveMembership: (input) =>
      ipcRenderer.invoke(ipcChannels.crmSaveMembership, input)
  },

  online: {
    dashboard: () =>
      ipcRenderer.invoke(ipcChannels.onlineDashboard),

    saveChannel: (input) =>
      ipcRenderer.invoke(ipcChannels.onlineSaveChannel, input),

    generateQr: (input) =>
      ipcRenderer.invoke(ipcChannels.onlineGenerateQr, input),

    createOrder: (input) =>
      ipcRenderer.invoke(ipcChannels.onlineCreateOrder, input),

    updateStatus: (input) =>
      ipcRenderer.invoke(ipcChannels.onlineUpdateStatus, input)
  },
  menu: { dashboard:()=>ipcRenderer.invoke(ipcChannels.menuDashboard), saveCategory:(input)=>ipcRenderer.invoke(ipcChannels.menuSaveCategory,input), saveProduct:(input)=>ipcRenderer.invoke(ipcChannels.menuSaveProduct,input), saveVariant:(input)=>ipcRenderer.invoke(ipcChannels.menuSaveVariant,input), saveModifierGroup:(input)=>ipcRenderer.invoke(ipcChannels.menuSaveModifierGroup,input), saveModifier:(input)=>ipcRenderer.invoke(ipcChannels.menuSaveModifier,input), assignModifierGroup:(input)=>ipcRenderer.invoke(ipcChannels.menuAssignModifierGroup,input) },
  outlets: { dashboard:()=>ipcRenderer.invoke(ipcChannels.outletsDashboard), save:(input)=>ipcRenderer.invoke(ipcChannels.outletsSave,input), createTransfer:(input)=>ipcRenderer.invoke(ipcChannels.outletsCreateTransfer,input), sendTransfer:(input)=>ipcRenderer.invoke(ipcChannels.outletsSendTransfer,input), receiveTransfer:(input)=>ipcRenderer.invoke(ipcChannels.outletsReceiveTransfer,input), seedBalance:()=>ipcRenderer.invoke(ipcChannels.outletsSeedBalance) },
  accounting: {
    dashboard: () => ipcRenderer.invoke(ipcChannels.accountingDashboard),
    saveAccount: (input) => ipcRenderer.invoke(ipcChannels.accountingSaveAccount, input),
    createEntry: (input) => ipcRenderer.invoke(ipcChannels.accountingCreateEntry, input)
  },
  enterprise: {
    dashboard: () => ipcRenderer.invoke(ipcChannels.enterpriseDashboard),
    activateLicense: (input) => ipcRenderer.invoke(ipcChannels.enterpriseActivateLicense, input),
    registerDevice: (input) => ipcRenderer.invoke(ipcChannels.enterpriseRegisterDevice, input),
    revokeDevice: (input) => ipcRenderer.invoke(ipcChannels.enterpriseRevokeDevice, input),
    createApiKey: (input) => ipcRenderer.invoke(ipcChannels.enterpriseCreateApiKey, input),
    revokeApiKey: (input) => ipcRenderer.invoke(ipcChannels.enterpriseRevokeApiKey, input),
    createBackup: () => ipcRenderer.invoke(ipcChannels.enterpriseCreateBackup),
    requestRestore: (input) => ipcRenderer.invoke(ipcChannels.enterpriseRequestRestore, input)
  },
  kot: {
    preview: (input) => ipcRenderer.invoke(ipcChannels.kotPreview, input),
    create: (input) => ipcRenderer.invoke(ipcChannels.kotCreate, input),
    get: (input) => ipcRenderer.invoke(ipcChannels.kotGet, input),
    listByOrder: (input) => ipcRenderer.invoke(ipcChannels.kotListByOrder, input),
    cancel: (input) => ipcRenderer.invoke(ipcChannels.kotCancel, input),
    markStarted: (input) => ipcRenderer.invoke(ipcChannels.kotMarkStarted, input),
    markReady: (input) => ipcRenderer.invoke(ipcChannels.kotMarkReady, input),
    markCompleted: (input) => ipcRenderer.invoke(ipcChannels.kotMarkCompleted, input),
    reprint: (input) => ipcRenderer.invoke(ipcChannels.kotReprint, input)
  }
};
