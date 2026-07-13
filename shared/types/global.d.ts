import type { AuthResponse, AuthSession, PasswordLoginInput, PinLoginInput } from "../contracts/auth-contracts";
import type { CatalogBootstrap, ProductDetail, ProductSearchInput, ProductSearchResult, ProductCategory } from "../contracts/catalog-contracts";
import type { CustomerSearchInput, CustomerSummary } from "../contracts/customer-contracts";
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

export type PosApi = {
  system: {
    getAppInfo: () => Promise<IpcResult<AppInfo>>;
    getHealth: () => Promise<IpcResult<SystemHealth>>;
    getConnectivity: () => Promise<IpcResult<ConnectivityStatus>>;
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
