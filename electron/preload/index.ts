import { contextBridge, ipcRenderer } from "electron";
import type { PosApi } from "../../shared/types/global";
import { ipcChannels } from "../../shared/contracts/ipc-contracts";

const posApi: PosApi = {
  system: {
    getAppInfo: () => ipcRenderer.invoke(ipcChannels.systemGetAppInfo),
    getHealth: () => ipcRenderer.invoke(ipcChannels.systemGetHealth),
    getConnectivity: () => ipcRenderer.invoke(ipcChannels.systemGetConnectivity)
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
    listRecent: () => ipcRenderer.invoke(ipcChannels.customersListRecent)
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
  shift: {
    getOpen: () => ipcRenderer.invoke(ipcChannels.shiftGetOpen),
    open: (input) => ipcRenderer.invoke(ipcChannels.shiftOpen, input),
    close: (input) => ipcRenderer.invoke(ipcChannels.shiftClose, input)
  },
  billing: {
    preview: (input) => ipcRenderer.invoke(ipcChannels.billingPreview, input),
    settle: (input) => ipcRenderer.invoke(ipcChannels.billingSettle, input),
    getByOrder: (input) => ipcRenderer.invoke(ipcChannels.billingGetByOrder, input),
    printReceipt: (input) => ipcRenderer.invoke(ipcChannels.billingPrintReceipt, input)
  },
  printers: {
    list: () => ipcRenderer.invoke(ipcChannels.printersList),
    save: (input) => ipcRenderer.invoke(ipcChannels.printersSave, input),
    diagnostics: (input) => ipcRenderer.invoke(ipcChannels.printersDiagnostics, input),
    test: (input) => ipcRenderer.invoke(ipcChannels.printersTest, input),
    openDrawer: (input) => ipcRenderer.invoke(ipcChannels.printersOpenDrawer, input),
    listRoutes: () => ipcRenderer.invoke(ipcChannels.printersListRoutes),
    saveRoute: (input) => ipcRenderer.invoke(ipcChannels.printersSaveRoute, input)
  },
  printJobs: {
    list: () => ipcRenderer.invoke(ipcChannels.printJobsList),
    process: () => ipcRenderer.invoke(ipcChannels.printJobsProcess),
    retry: (input) => ipcRenderer.invoke(ipcChannels.printJobsRetry, input),
    queueKot: (input) => ipcRenderer.invoke(ipcChannels.printJobsQueueKot, input)
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

contextBridge.exposeInMainWorld("pos", posApi);
