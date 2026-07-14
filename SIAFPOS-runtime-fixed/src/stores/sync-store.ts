import { create } from "zustand";
import type { ConfigureSyncInput, ProcessSyncResult, SyncStatus } from "../../shared/contracts/sync-contracts";

type SyncStore = {
  status: SyncStatus | null;
  lastResult: ProcessSyncResult | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  configure: (input: ConfigureSyncInput) => Promise<boolean>;
  process: () => Promise<void>;
  retryFailed: () => Promise<void>;
};

export const useSyncStore = create<SyncStore>((set) => ({
  status: null,
  lastResult: null,
  loading: false,
  error: null,
  refresh: async () => {
    set({ loading: true, error: null });
    const result = await window.pos.sync.getStatus();
    if (result.success) set({ status: result.data, loading: false });
    else set({ error: result.error.message, loading: false });
  },
  configure: async (input) => {
    set({ loading: true, error: null });
    const result = await window.pos.sync.configure(input);
    if (result.success) { set({ status: result.data, loading: false }); return true; }
    set({ error: result.error.message, loading: false }); return false;
  },
  process: async () => {
    set({ loading: true, error: null });
    const result = await window.pos.sync.process();
    if (result.success) {
      const statusResult = await window.pos.sync.getStatus();
      set({ lastResult: result.data, status: statusResult.success ? statusResult.data : null, loading: false });
    } else set({ error: result.error.message, loading: false });
  },
  retryFailed: async () => {
    set({ loading: true, error: null });
    const result = await window.pos.sync.retryFailed();
    if (result.success) set({ status: result.data, loading: false });
    else set({ error: result.error.message, loading: false });
  }
}));
