import { create } from "zustand";
import type { DiscountType, OrderDraft, OrderType } from "@shared/contracts/order-contracts";
import { getPosApi, getPreloadUnavailableMessage } from "../utils/pos-api";

type PosState = {
  currentOrder: OrderDraft | null;
  selectedItemUuid: string | null;
  loading: boolean;
  error: string | null;
  ensureOrder: (orderType?: OrderType) => Promise<void>;
  setOrder: (order: OrderDraft | null) => void;
  setSelectedItemUuid: (orderItemUuid: string | null) => void;
  addProduct: (productUuid: string, variantUuid?: string) => Promise<void>;
  updateQuantity: (orderItemUuid: string, quantity: number) => Promise<void>;
  removeItem: (orderItemUuid: string) => Promise<void>;
  setItemVariant: (orderItemUuid: string, variantUuid: string) => Promise<void>;
  setItemModifiers: (orderItemUuid: string, modifierUuids: string[]) => Promise<void>;
  setItemNote: (orderItemUuid: string, kitchenNote: string) => Promise<void>;
  setCustomer: (customerUuid: string | null) => Promise<void>;
  setOrderType: (orderType: OrderType) => Promise<void>;
  setTable: (tableUuid: string | null) => Promise<void>;
  setWaiter: (waiterUuid: string | null) => Promise<void>;
  applyDiscount: (type: DiscountType, value: number) => Promise<void>;
  removeDiscount: () => Promise<void>;
  hold: () => Promise<void>;
  recall: (orderUuid: string) => Promise<void>;
  loadSummary: (orderUuid: string) => Promise<void>;
};

export const usePosStore = create<PosState>((set, get) => ({
  currentOrder: null,
  selectedItemUuid: null,
  loading: false,
  error: null,
  ensureOrder: async (orderType = "takeaway") => {
    const api = getPosApi();
    if (!api) {
      set({ loading: false, error: getPreloadUnavailableMessage() });
      return;
    }

    const currentOrder = get().currentOrder;
    if (currentOrder) {
      return;
    }
    set({ loading: true, error: null });
    const result = await api.orders.createDraft({ orderType });
    if (!result.success) {
      set({ loading: false, error: result.error.message });
      return;
    }
    set({ currentOrder: result.data, loading: false, error: null });
  },
  setOrder: (order) => set({ currentOrder: order }),
  setSelectedItemUuid: (orderItemUuid) => set({ selectedItemUuid: orderItemUuid }),
  addProduct: async (productUuid, variantUuid) => {
    await mutateOrder(set, get, (api, orderUuid) => api.orders.addItem({ orderUuid, productUuid, variantUuid }));
  },
  updateQuantity: async (orderItemUuid, quantity) => {
    await mutateOrder(set, get, (api, orderUuid) => api.orders.updateItemQuantity({ orderUuid, orderItemUuid, quantity }));
  },
  removeItem: async (orderItemUuid) => {
    await mutateOrder(set, get, (api, orderUuid) => api.orders.removeItem({ orderUuid, orderItemUuid }));
  },
  setItemVariant: async (orderItemUuid, variantUuid) => {
    await mutateOrder(set, get, (api, orderUuid) => api.orders.setItemVariant({ orderUuid, orderItemUuid, variantUuid }));
  },
  setItemModifiers: async (orderItemUuid, modifierUuids) => {
    await mutateOrder(set, get, (api, orderUuid) => api.orders.setItemModifiers({ orderUuid, orderItemUuid, modifierUuids }));
  },
  setItemNote: async (orderItemUuid, kitchenNote) => {
    await mutateOrder(set, get, (api, orderUuid) => api.orders.setItemNote({ orderUuid, orderItemUuid, kitchenNote }));
  },
  setCustomer: async (customerUuid) => {
    await mutateOrder(set, get, (api, orderUuid) => api.orders.setCustomer({ orderUuid, customerUuid }));
  },
  setOrderType: async (orderType) => {
    await mutateOrder(set, get, (api, orderUuid) => api.orders.setOrderType({ orderUuid, orderType }));
  },
  setTable: async (tableUuid) => {
    await mutateOrder(set, get, (api, orderUuid) => api.orders.setTable({ orderUuid, tableUuid }));
  },
  setWaiter: async (waiterUuid) => {
    await mutateOrder(set, get, (api, orderUuid) => api.orders.setWaiter({ orderUuid, waiterUuid }));
  },
  applyDiscount: async (type, value) => {
    await mutateOrder(set, get, (api, orderUuid) => api.orders.applyDiscount({ orderUuid, type, value }));
  },
  removeDiscount: async () => {
    await mutateOrder(set, get, (api, orderUuid) => api.orders.removeDiscount({ orderUuid }));
  },
  hold: async () => {
    await mutateOrder(set, get, (api, orderUuid) => api.orders.hold({ orderUuid }));
  },
  recall: async (orderUuid) => {
    const api = getPosApi();
    if (!api) {
      set({ loading: false, error: getPreloadUnavailableMessage() });
      return;
    }

    set({ loading: true, error: null });
    const result = await api.orders.recallHeld({ orderUuid });
    if (!result.success) {
      set({ loading: false, error: result.error.message });
      return;
    }
    set({ currentOrder: result.data, loading: false, error: null, selectedItemUuid: null });
  },
  loadSummary: async (orderUuid) => {
    const api = getPosApi();
    if (!api) {
      set({ loading: false, error: getPreloadUnavailableMessage() });
      return;
    }

    set({ loading: true, error: null });
    const result = await api.orders.getSummary({ orderUuid });
    if (!result.success) {
      set({ loading: false, error: result.error.message });
      return;
    }
    set({ currentOrder: result.data, loading: false, error: null });
  }
}));

async function mutateOrder(
  set: (partial: Partial<PosState>) => void,
  get: () => PosState,
  invoke: (
    api: NonNullable<ReturnType<typeof getPosApi>>,
    orderUuid: string
  ) => Promise<{ success: true; data: OrderDraft } | { success: false; error: { message: string } }>
) {
  const api = getPosApi();
  if (!api) {
    set({ loading: false, error: getPreloadUnavailableMessage() });
    return;
  }

  let currentOrder = get().currentOrder;
  if (!currentOrder) {
    const create = await api.orders.createDraft({ orderType: "takeaway" });
    if (!create.success) {
      set({ error: create.error.message, loading: false });
      return;
    }
    currentOrder = create.data;
    set({ currentOrder });
  }

  set({ loading: true, error: null });
  const result = await invoke(api, currentOrder.uuid);
  if (!result.success) {
    set({ loading: false, error: result.error.message });
    return;
  }
  set({ currentOrder: result.data, loading: false, error: null });
}
