import { create } from "zustand";
import type { CatalogBootstrap, ProductCategory, ProductSearchResult } from "@shared/contracts/catalog-contracts";
import { getPosApi, getPreloadUnavailableMessage } from "../utils/pos-api";

type CatalogState = {
  categories: ProductCategory[];
  results: ProductSearchResult;
  selectedCategoryUuid: string | undefined;
  searchQuery: string;
  loading: boolean;
  error: string | null;
  loadBootstrap: () => Promise<void>;
  searchProducts: (input?: { categoryUuid?: string; query?: string; offset?: number; limit?: number; exactBarcode?: string }) => Promise<void>;
  setSelectedCategory: (categoryUuid?: string) => void;
  setSearchQuery: (query: string) => void;
};

const emptyResults: ProductSearchResult = {
  items: [],
  total: 0,
  offset: 0,
  limit: 60
};

export const useCatalogStore = create<CatalogState>((set, get) => ({
  categories: [],
  results: emptyResults,
  selectedCategoryUuid: undefined,
  searchQuery: "",
  loading: false,
  error: null,
  loadBootstrap: async () => {
    const api = getPosApi();
    if (!api) {
      set({ loading: false, error: getPreloadUnavailableMessage() });
      return;
    }

    set({ loading: true, error: null });
    const bootstrap = await api.catalog.getBootstrap();
    if (!bootstrap.success) {
      set({ loading: false, error: bootstrap.error.message });
      return;
    }

    const categories = bootstrap.data.categories;
    set({
      categories,
      selectedCategoryUuid: get().selectedCategoryUuid ?? categories[0]?.uuid,
      loading: false,
      error: null
    });
    await get().searchProducts({ offset: 0, limit: 60 });
  },
  searchProducts: async (input) => {
    const api = getPosApi();
    if (!api) {
      set({ loading: false, error: getPreloadUnavailableMessage() });
      return;
    }

    const state = get();
    set({ loading: true, error: null });
    const result = await api.catalog.searchProducts({
      categoryUuid: input?.categoryUuid ?? state.selectedCategoryUuid,
      query: input?.query ?? state.searchQuery,
      exactBarcode: input?.exactBarcode,
      offset: input?.offset ?? 0,
      limit: input?.limit ?? state.results.limit
    });

    if (!result.success) {
      set({ loading: false, error: result.error.message });
      return;
    }

    set({ results: result.data, loading: false, error: null });
  },
  setSelectedCategory: (categoryUuid) => set({ selectedCategoryUuid: categoryUuid }),
  setSearchQuery: (query) => set({ searchQuery: query })
}));
