import { create } from "zustand";
import type { AppInfo, ConnectivityStatus, DatabaseHealth, SystemHealth } from "@shared/contracts/system-contracts";
import { getPosApi, getPreloadUnavailableMessage } from "../utils/pos-api";

type SystemState = {
  appInfo: AppInfo | null;
  health: SystemHealth | null;
  databaseHealth: DatabaseHealth | null;
  connectivity: ConnectivityStatus | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export const useSystemStore = create<SystemState>((set) => ({
  appInfo: null,
  health: null,
  databaseHealth: null,
  connectivity: null,
  loading: false,
  error: null,
  refresh: async () => {
    const api = getPosApi();
    if (!api) {
      set({
        loading: false,
        error: getPreloadUnavailableMessage()
      });
      return;
    }

    set({ loading: true, error: null });
    const [appInfo, health, databaseHealth, connectivity] = await Promise.all([
      api.system.getAppInfo(),
      api.system.getHealth(),
      api.database.getHealth(),
      api.system.getConnectivity()
    ]);

    if (!appInfo.success || !health.success || !databaseHealth.success || !connectivity.success) {
      set({
        loading: false,
        error: "Unable to load full system status."
      });
      return;
    }

    set({
      appInfo: appInfo.data,
      health: health.data,
      databaseHealth: databaseHealth.data,
      connectivity: connectivity.data,
      loading: false,
      error: null
    });
  }
}));
