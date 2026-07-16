import type { ActivateDeviceInput, ActivationState } from "../contracts/activation-contracts";
import type { AuthResponse, AuthSession, PasswordLoginInput, PinLoginInput } from "../contracts/auth-contracts";
import type { CatalogBootstrap, ProductDetail, ProductSearchInput, ProductSearchResult, ProductCategory } from "../contracts/catalog-contracts";
import type { CustomerRefInput, CustomerSearchInput, CustomerSummary, SaveCustomerInput } from "../contracts/customer-contracts";
import type { ReportRangeInput, SalesReport } from "../contracts/report-contracts";
import type { IpcResult } from "../contracts/ipc-contracts";
import type { CancelKotInput, KotOrderRefInput, KotPreview, KotRefInput, KotTicketDetail, KotTicketSummary } from "../contracts/kot-contracts";
import type {
  AddOrderItemInput,
  ApplyOrderDiscountInput,
  CreateOrderDraftInput,
  HeldOrderSummary,
  OrderDraft,
  OrderRefInput,
  RecallHeldOrderInput,
  RemoveOrderDiscountInput,
  RemoveOrderItemInput,
  RunningOrderSummary,
  SetOrderCustomerInput,
  SetOrderItemModifiersInput,
  SetOrderItemNoteInput,
  SetOrderItemVariantInput,
  SetOrderTableInput,
  SetOrderTypeInput,
  SetOrderWaiterInput,
  UpdateOrderItemQuantityInput
} from "../contracts/order-contracts";
import type { SettingsGetInput, SettingsSetInput, SettingRecord } from "../contracts/settings-contracts";
import type { AppInfo, ConnectivityStatus, DatabaseHealth, DatabaseVersion, SystemHealth } from "../contracts/system-contracts";
import type { FloorMap, WaiterSummary } from "../contracts/table-contracts";
import type { BillDetail, BillPreview, BillOrderRefInput, BillRefInput, CashShift, CloseShiftInput, OpenShiftInput, PrintReceiptResult, SettleBillInput } from "../contracts/billing-contracts";
import type { PrintJobSummary, PrinterDiagnostics, PrinterProfile, PrinterRefInput, PrinterRoute, QueueKotPrintInput, RetryPrintJobInput, SavePrinterInput, SavePrinterRouteInput } from "../contracts/printer-contracts";
import type { ConfigureSyncInput, ProcessSyncResult, SyncStatus } from "../contracts/sync-contracts";
import type { CreatePurchaseInput, InventoryDashboard, InventoryItem, PurchaseSummary, Recipe, SaveInventoryItemInput, SaveRecipeInput, SaveSupplierInput, StockAdjustmentInput, Supplier } from "../contracts/inventory-contracts";
import type { AssignModifierGroupInput, MenuDashboard, MenuProductAdmin, SaveMenuCategoryInput, SaveMenuProductInput, SaveModifierGroupInput, SaveModifierInput, SaveProductVariantInput } from "../contracts/menu-management-contracts";
import type { CreateStockTransferInput, MultiOutletDashboard, OutletAdmin, SaveOutletInput } from "../contracts/multi-outlet-contracts";
import type { AttendanceEntry, AttendanceInput, Employee, PayrollEntry, SaveEmployeeInput, SavePayrollInput, SaveRoleInput, StaffDashboard, StaffRole } from "../contracts/staff-contracts";
import type {
  AdjustLoyaltyInput,
  Coupon,
  CrmDashboard,
  LoyaltyAccount,
  Membership,
  SaveCouponInput,
  SaveMembershipInput
} from "../contracts/crm-contracts";

import type { CreateFinanceEntryInput, FinanceAccount, FinanceDashboard, FinanceEntry, SaveFinanceAccountInput } from "../contracts/accounting-contracts";
import type { ActivateLicenseInput, CreateApiKeyInput, EnterpriseApiKey, EnterpriseBackup, EnterpriseDashboard, EnterpriseDevice, EnterpriseLicense, RegisterDeviceInput } from "../contracts/enterprise-contracts";

import type {
  CreateOnlineOrderInput,
  GenerateQrTokenInput,
  OnlineChannel,
  OnlineDashboard,
  OnlineOrder,
  QrTableToken,
  SaveOnlineChannelInput,
  UpdateOnlineOrderStatusInput
} from "../contracts/online-contracts";

export type PosApi = {
  system: {
    getAppInfo: () => Promise<IpcResult<AppInfo>>;
    getHealth: () => Promise<IpcResult<SystemHealth>>;
    getConnectivity: () => Promise<IpcResult<ConnectivityStatus>>;
  };
  activation: {
    getState: () => Promise<IpcResult<ActivationState>>;
    activate: (input: ActivateDeviceInput) => Promise<IpcResult<ActivationState>>;
  };
  database: {
    getHealth: () => Promise<IpcResult<DatabaseHealth>>;
    getVersion: () => Promise<IpcResult<DatabaseVersion>>;
  };
  auth: {
    loginWithPassword: (input: PasswordLoginInput) => Promise<IpcResult<AuthResponse>>;
    loginWithPin: (input: PinLoginInput) => Promise<IpcResult<AuthResponse>>;
    getSession: () => Promise<IpcResult<AuthSession | null>>;
    logout: () => Promise<IpcResult<{ loggedOut: true }>>;
  };
  settings: {
    get: (input: SettingsGetInput) => Promise<IpcResult<SettingRecord | null>>;
    set: (input: SettingsSetInput) => Promise<IpcResult<SettingRecord>>;
  };
  catalog: {
    getBootstrap: () => Promise<IpcResult<CatalogBootstrap>>;
    listCategories: () => Promise<IpcResult<ProductCategory[]>>;
    searchProducts: (input: ProductSearchInput) => Promise<IpcResult<ProductSearchResult>>;
    getProduct: (input: { productUuid: string }) => Promise<IpcResult<ProductDetail>>;
  };
  customers: {
    search: (input: CustomerSearchInput) => Promise<IpcResult<CustomerSummary[]>>;
    listRecent: () => Promise<IpcResult<CustomerSummary[]>>;
    save: (input: SaveCustomerInput) => Promise<IpcResult<CustomerSummary>>;
    setActive: (input: CustomerRefInput & { isActive: boolean }) => Promise<IpcResult<CustomerSummary>>;
  };
  tables: {
    getFloorMap: () => Promise<IpcResult<FloorMap>>;
    listWaiters: () => Promise<IpcResult<WaiterSummary[]>>;
  };
  orders: {
    createDraft: (input: CreateOrderDraftInput) => Promise<IpcResult<OrderDraft>>;
    getDraft: (input: OrderRefInput) => Promise<IpcResult<OrderDraft>>;
    addItem: (input: AddOrderItemInput) => Promise<IpcResult<OrderDraft>>;
    updateItemQuantity: (input: UpdateOrderItemQuantityInput) => Promise<IpcResult<OrderDraft>>;
    removeItem: (input: RemoveOrderItemInput) => Promise<IpcResult<OrderDraft>>;
    setItemVariant: (input: SetOrderItemVariantInput) => Promise<IpcResult<OrderDraft>>;
    setItemModifiers: (input: SetOrderItemModifiersInput) => Promise<IpcResult<OrderDraft>>;
    setItemNote: (input: SetOrderItemNoteInput) => Promise<IpcResult<OrderDraft>>;
    setCustomer: (input: SetOrderCustomerInput) => Promise<IpcResult<OrderDraft>>;
    setOrderType: (input: SetOrderTypeInput) => Promise<IpcResult<OrderDraft>>;
    setTable: (input: SetOrderTableInput) => Promise<IpcResult<OrderDraft>>;
    setWaiter: (input: SetOrderWaiterInput) => Promise<IpcResult<OrderDraft>>;
    applyDiscount: (input: ApplyOrderDiscountInput) => Promise<IpcResult<OrderDraft>>;
    removeDiscount: (input: RemoveOrderDiscountInput) => Promise<IpcResult<OrderDraft>>;
    hold: (input: OrderRefInput) => Promise<IpcResult<OrderDraft>>;
    listHeld: () => Promise<IpcResult<HeldOrderSummary[]>>;
    recallHeld: (input: RecallHeldOrderInput) => Promise<IpcResult<OrderDraft>>;
    listRunning: () => Promise<IpcResult<RunningOrderSummary[]>>;
    getSummary: (input: OrderRefInput) => Promise<IpcResult<OrderDraft>>;
  };
  shift: {
    getOpen: () => Promise<IpcResult<CashShift | null>>;
    open: (input: OpenShiftInput) => Promise<IpcResult<CashShift>>;
    close: (input: CloseShiftInput) => Promise<IpcResult<CashShift>>;
  };
  billing: {
    preview: (input: BillOrderRefInput) => Promise<IpcResult<BillDetail | BillPreview>>;
    settle: (input: SettleBillInput) => Promise<IpcResult<BillDetail>>;
    getByOrder: (input: BillOrderRefInput) => Promise<IpcResult<BillDetail>>;
    printReceipt: (input: BillRefInput) => Promise<IpcResult<PrintReceiptResult>>;
  };
  printers: {
    list: () => Promise<IpcResult<PrinterProfile[]>>;
    save: (input: SavePrinterInput) => Promise<IpcResult<PrinterProfile>>;
    diagnostics: (input: PrinterRefInput) => Promise<IpcResult<PrinterDiagnostics>>;
    test: (input: PrinterRefInput) => Promise<IpcResult<{ printJobUuid: string }>>;
    openDrawer: (input: PrinterRefInput) => Promise<IpcResult<{ printJobUuid: string }>>;
    listRoutes: () => Promise<IpcResult<PrinterRoute[]>>;
    saveRoute: (input: SavePrinterRouteInput) => Promise<IpcResult<PrinterRoute>>;
  };
  printJobs: {
    list: () => Promise<IpcResult<PrintJobSummary[]>>;
    process: () => Promise<IpcResult<{ processed:number; printed:number; failed:number }>>;
    retry: (input: RetryPrintJobInput) => Promise<IpcResult<{ retried:true }>>;
    queueKot: (input: QueueKotPrintInput) => Promise<IpcResult<{ printJobUuid:string }>>;
  };
  sync: {
    getStatus: () => Promise<IpcResult<SyncStatus>>;
    configure: (input: ConfigureSyncInput) => Promise<IpcResult<SyncStatus>>;
    process: () => Promise<IpcResult<ProcessSyncResult>>;
    retryFailed: () => Promise<IpcResult<SyncStatus>>;
  };
  reports: { sales: (input: ReportRangeInput) => Promise<IpcResult<SalesReport>>; };
  inventory: {
    dashboard: () => Promise<IpcResult<InventoryDashboard>>;
    saveItem: (input: SaveInventoryItemInput) => Promise<IpcResult<InventoryItem>>;
    adjust: (input: StockAdjustmentInput) => Promise<IpcResult<InventoryItem>>;
    saveSupplier: (input: SaveSupplierInput) => Promise<IpcResult<Supplier>>;
    saveRecipe: (input: SaveRecipeInput) => Promise<IpcResult<Recipe>>;
    createPurchase: (input: CreatePurchaseInput) => Promise<IpcResult<PurchaseSummary>>;
    cancelPurchase: (input: { purchaseUuid:string }) => Promise<IpcResult<PurchaseSummary>>;
  };
  staff: {
    dashboard: () => Promise<IpcResult<StaffDashboard>>;
    saveEmployee: (input: SaveEmployeeInput) => Promise<IpcResult<Employee>>;
    saveRole: (input: SaveRoleInput) => Promise<IpcResult<StaffRole>>;
    checkIn: (input: AttendanceInput) => Promise<IpcResult<AttendanceEntry>>;
    checkOut: (input: AttendanceInput) => Promise<IpcResult<AttendanceEntry>>;
    savePayroll: (input: SavePayrollInput) => Promise<IpcResult<PayrollEntry>>;
  };
  crm: {
    dashboard: () => Promise<IpcResult<CrmDashboard>>;
    adjust: (
      input: AdjustLoyaltyInput
    ) => Promise<IpcResult<LoyaltyAccount>>;
    saveCoupon: (
      input: SaveCouponInput
    ) => Promise<IpcResult<Coupon>>;
    saveMembership: (
      input: SaveMembershipInput
    ) => Promise<IpcResult<Membership>>;
  };

  online: {
    dashboard: () => Promise<IpcResult<OnlineDashboard>>;
    saveChannel: (
      input: SaveOnlineChannelInput
    ) => Promise<IpcResult<OnlineChannel>>;
    generateQr: (
      input: GenerateQrTokenInput
    ) => Promise<IpcResult<QrTableToken>>;
    createOrder: (
      input: CreateOnlineOrderInput
    ) => Promise<IpcResult<OnlineOrder>>;
    updateStatus: (
      input: UpdateOnlineOrderStatusInput
    ) => Promise<IpcResult<OnlineOrder>>;
  };
  menu: {
    dashboard: () => Promise<IpcResult<MenuDashboard>>;
    saveCategory: (input: SaveMenuCategoryInput) => Promise<IpcResult<unknown>>;
    saveProduct: (input: SaveMenuProductInput) => Promise<IpcResult<MenuProductAdmin>>;
    saveVariant: (input: SaveProductVariantInput) => Promise<IpcResult<unknown>>;
    saveModifierGroup: (input: SaveModifierGroupInput) => Promise<IpcResult<unknown>>;
    saveModifier: (input: SaveModifierInput) => Promise<IpcResult<unknown>>;
    assignModifierGroup: (input: AssignModifierGroupInput) => Promise<IpcResult<boolean>>;
  };
  outlets: {
    dashboard: () => Promise<IpcResult<MultiOutletDashboard>>;
    save: (input: SaveOutletInput) => Promise<IpcResult<OutletAdmin>>;
    createTransfer: (input: CreateStockTransferInput) => Promise<IpcResult<string>>;
    sendTransfer: (input: { transferUuid: string }) => Promise<IpcResult<boolean>>;
    receiveTransfer: (input: { transferUuid: string }) => Promise<IpcResult<boolean>>;
    seedBalance: () => Promise<IpcResult<number>>;
  };
  accounting: {
    dashboard: () => Promise<IpcResult<FinanceDashboard>>;
    saveAccount: (input: SaveFinanceAccountInput) => Promise<IpcResult<FinanceAccount>>;
    createEntry: (input: CreateFinanceEntryInput) => Promise<IpcResult<FinanceEntry>>;
  };
  enterprise: {
    dashboard: () => Promise<IpcResult<EnterpriseDashboard>>;
    activateLicense: (input: ActivateLicenseInput) => Promise<IpcResult<EnterpriseLicense>>;
    registerDevice: (input: RegisterDeviceInput) => Promise<IpcResult<EnterpriseDevice>>;
    revokeDevice: (input: { uuid: string }) => Promise<IpcResult<EnterpriseDevice>>;
    createApiKey: (input: CreateApiKeyInput) => Promise<IpcResult<EnterpriseApiKey>>;
    revokeApiKey: (input: { uuid: string }) => Promise<IpcResult<EnterpriseApiKey>>;
    createBackup: () => Promise<IpcResult<EnterpriseBackup>>;
    requestRestore: (input: { uuid: string }) => Promise<IpcResult<EnterpriseBackup>>;
  };
  kot: {
    preview: (input: KotOrderRefInput) => Promise<IpcResult<KotPreview>>;
    create: (input: KotOrderRefInput) => Promise<IpcResult<KotTicketDetail>>;
    get: (input: KotRefInput) => Promise<IpcResult<KotTicketDetail>>;
    listByOrder: (input: KotOrderRefInput) => Promise<IpcResult<KotTicketSummary[]>>;
    cancel: (input: CancelKotInput) => Promise<IpcResult<KotTicketDetail>>;
    markStarted: (input: KotRefInput) => Promise<IpcResult<KotTicketDetail>>;
    markReady: (input: KotRefInput) => Promise<IpcResult<KotTicketDetail>>;
    markCompleted: (input: KotRefInput) => Promise<IpcResult<KotTicketDetail>>;
    reprint: (input: KotRefInput) => Promise<IpcResult<KotTicketDetail>>;
  };
};

declare global {
  interface Window {
    pos: PosApi;
  }
}
