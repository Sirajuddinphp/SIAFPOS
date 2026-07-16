import { create } from "zustand";
import type { ActivateDeviceInput, ActivationState } from "../../shared/contracts/activation-contracts";

type ActivationStore = {
  state: ActivationState | null;
  loading: boolean;
  error: string | null;
  load: () => Promise<ActivationState>;
  activate: (input: ActivateDeviceInput) => Promise<boolean>;
};

export const useActivationStore = create<ActivationStore>((set) => ({
  state: null,
  loading: false,
  error: null,
  load: async () => {
    set({ loading: true, error: null });
    const result = await window.pos.activation.getState();
    if (!result.success) {
      set({ loading: false, error: result.error.message });
      throw new Error(result.error.message);
    }
    set({ state: result.data, loading: false });
    return result.data;
  },
  activate: async (input) => {
    set({ loading: true, error: null });
    const result = await window.pos.activation.activate(input);
    if (!result.success) {
      set({ loading: false, error: result.error.message });
      return false;
    }
    set({ state: result.data, loading: false });
    return result.data.activated;
  }
}));
