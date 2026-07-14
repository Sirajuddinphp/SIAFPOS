import { create } from "zustand";
import type { KotPreview, KotTicketDetail, KotTicketSummary } from "@shared/contracts/kot-contracts";
import { getPosApi, getPreloadUnavailableMessage } from "../utils/pos-api";

type KotState = {
  preview: KotPreview | null;
  orderTickets: KotTicketSummary[];
  kitchenTickets: KotTicketSummary[];
  selectedTicket: KotTicketDetail | null;
  loading: boolean;
  error: string | null;
  loadPreview: (orderUuid: string) => Promise<KotPreview | null>;
  createKot: (orderUuid: string) => Promise<KotTicketDetail | null>;
  loadOrderTickets: (orderUuid: string) => Promise<void>;
  loadTicket: (kotUuid: string) => Promise<KotTicketDetail | null>;
  cancelKot: (kotUuid: string, reason?: string) => Promise<KotTicketDetail | null>;
  markStarted: (kotUuid: string) => Promise<KotTicketDetail | null>;
  markReady: (kotUuid: string) => Promise<KotTicketDetail | null>;
  markCompleted: (kotUuid: string) => Promise<KotTicketDetail | null>;
  reprintKot: (kotUuid: string) => Promise<KotTicketDetail | null>;
  loadKitchenQueue: () => Promise<void>;
  clearPreview: () => void;
};

export const useKotStore = create<KotState>((set, get) => ({
  preview: null,
  orderTickets: [],
  kitchenTickets: [],
  selectedTicket: null,
  loading: false,
  error: null,
  loadPreview: async (orderUuid) => {
    const api = getPosApi();
    if (!api) {
      set({ loading: false, error: getPreloadUnavailableMessage() });
      return null;
    }

    set({ loading: true, error: null });
    const result = await api.kot.preview({ orderUuid });
    if (!result.success) {
      set({ loading: false, error: result.error.message, preview: null });
      return null;
    }

    set({ loading: false, error: null, preview: result.data });
    return result.data;
  },
  createKot: async (orderUuid) => {
    const api = getPosApi();
    if (!api) {
      set({ loading: false, error: getPreloadUnavailableMessage() });
      return null;
    }

    set({ loading: true, error: null });
    const result = await api.kot.create({ orderUuid });
    if (!result.success) {
      set({ loading: false, error: result.error.message });
      return null;
    }

    set({ loading: false, error: null, selectedTicket: result.data, preview: null });
    await get().loadOrderTickets(orderUuid);
    await get().loadKitchenQueue();
    return result.data;
  },
  loadOrderTickets: async (orderUuid) => {
    const api = getPosApi();
    if (!api) {
      set({ loading: false, error: getPreloadUnavailableMessage() });
      return;
    }

    const result = await api.kot.listByOrder({ orderUuid });
    if (!result.success) {
      set({ error: result.error.message });
      return;
    }

    set({ orderTickets: result.data, error: null });
  },
  loadTicket: async (kotUuid) => {
    const api = getPosApi();
    if (!api) {
      set({ loading: false, error: getPreloadUnavailableMessage() });
      return null;
    }

    set({ loading: true, error: null });
    const result = await api.kot.get({ kotUuid });
    if (!result.success) {
      set({ loading: false, error: result.error.message });
      return null;
    }

    set({ loading: false, error: null, selectedTicket: result.data });
    return result.data;
  },
  cancelKot: async (kotUuid, reason) => runKotMutation(set, get, (api) => api.kot.cancel({ kotUuid, reason })),
  markStarted: async (kotUuid) => runKotMutation(set, get, (api) => api.kot.markStarted({ kotUuid })),
  markReady: async (kotUuid) => runKotMutation(set, get, (api) => api.kot.markReady({ kotUuid })),
  markCompleted: async (kotUuid) => runKotMutation(set, get, (api) => api.kot.markCompleted({ kotUuid })),
  reprintKot: async (kotUuid) => runKotMutation(set, get, (api) => api.kot.reprint({ kotUuid })),
  loadKitchenQueue: async () => {
    const api = getPosApi();
    if (!api) {
      set({ loading: false, error: getPreloadUnavailableMessage() });
      return;
    }

    set({ loading: true, error: null });
    const [runningOrders, heldOrders] = await Promise.all([api.orders.listRunning(), api.orders.listHeld()]);
    if (!runningOrders.success || !heldOrders.success) {
      set({ loading: false, error: "Unable to load kitchen queue." });
      return;
    }

    const orderUuids = Array.from(new Set([...runningOrders.data.map((order) => order.uuid), ...heldOrders.data.map((order) => order.uuid)]));
    const ticketResults = await Promise.all(orderUuids.map((orderUuid) => api.kot.listByOrder({ orderUuid })));
    const kitchenTickets = ticketResults
      .flatMap((result) => (result.success ? result.data : []))
      .filter((ticket) => ticket.kind !== "reprint")
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    set({ loading: false, error: null, kitchenTickets });
  },
  clearPreview: () => set({ preview: null, error: null })
}));

async function runKotMutation(
  set: (partial: Partial<KotState>) => void,
  get: () => KotState,
  invoke: (api: NonNullable<ReturnType<typeof getPosApi>>) => Promise<{ success: true; data: KotTicketDetail } | { success: false; error: { message: string } }>
) {
  const api = getPosApi();
  if (!api) {
    set({ loading: false, error: getPreloadUnavailableMessage() });
    return null;
  }

  set({ loading: true, error: null });
  const result = await invoke(api);
  if (!result.success) {
    set({ loading: false, error: result.error.message });
    return null;
  }

  set({ loading: false, error: null, selectedTicket: result.data });
  await get().loadOrderTickets(result.data.orderUuid);
  await get().loadKitchenQueue();
  return result.data;
}
