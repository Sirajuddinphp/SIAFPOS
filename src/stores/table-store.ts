import { create } from "zustand";
import type { FloorMap, WaiterSummary } from "@shared/contracts/table-contracts";
import { getPosApi, getPreloadUnavailableMessage } from "../utils/pos-api";

type TableState = {
  floorMap: FloorMap | null;
  waiters: WaiterSummary[];
  selectedFloor: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setSelectedFloor: (floor: string | null) => void;
};

export const useTableStore = create<TableState>((set) => ({
  floorMap: null,
  waiters: [],
  selectedFloor: null,
  loading: false,
  error: null,
  refresh: async () => {
    const api = getPosApi();
    if (!api) {
      set({ loading: false, error: getPreloadUnavailableMessage() });
      return;
    }

    set({ loading: true, error: null });
    const [floorMap, waiters] = await Promise.all([api.tables.getFloorMap(), api.tables.listWaiters()]);
    if (!floorMap.success || !waiters.success) {
      const message = !floorMap.success ? floorMap.error.message : !waiters.success ? waiters.error.message : "Unable to load tables.";
      set({ loading: false, error: message });
      return;
    }

    set({
      floorMap: floorMap.data,
      waiters: waiters.data,
      selectedFloor: floorMap.data.floors[0] ?? null,
      loading: false,
      error: null
    });
  },
  setSelectedFloor: (floor) => set({ selectedFloor: floor })
}));
