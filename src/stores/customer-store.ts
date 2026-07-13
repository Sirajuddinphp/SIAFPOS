import { create } from "zustand";
import type { CustomerSummary } from "@shared/contracts/customer-contracts";
import { getPosApi, getPreloadUnavailableMessage } from "../utils/pos-api";

type CustomerState = {
  customers: CustomerSummary[];
  loading: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
  loadRecent: () => Promise<void>;
};

export const useCustomerStore = create<CustomerState>((set) => ({
  customers: [],
  loading: false,
  error: null,
  search: async (query: string) => {
    const api = getPosApi();
    if (!api) {
      set({ loading: false, error: getPreloadUnavailableMessage() });
      return;
    }

    set({ loading: true, error: null });
    const result = await api.customers.search({ query, limit: 12 });
    if (!result.success) {
      set({ loading: false, error: result.error.message });
      return;
    }
    set({ customers: result.data, loading: false, error: null });
  },
  loadRecent: async () => {
    const api = getPosApi();
    if (!api) {
      set({ loading: false, error: getPreloadUnavailableMessage() });
      return;
    }

    set({ loading: true, error: null });
    const result = await api.customers.listRecent();
    if (!result.success) {
      set({ loading: false, error: result.error.message });
      return;
    }
    set({ customers: result.data, loading: false, error: null });
  }
}));
