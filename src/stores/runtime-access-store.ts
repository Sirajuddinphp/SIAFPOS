import { create } from "zustand";
import type {
  RuntimeAccessState,
  RuntimeRegistrationInput,
  RuntimeStatus
} from "../../shared/contracts/runtime-access-contracts";

type RuntimeAccessStore = {
  status: RuntimeStatus | null;
  loading: boolean;
  error: string | null;
  load: () => Promise<RuntimeStatus | null>;
  verify: () => Promise<RuntimeStatus | null>;
  startTrial: (input: RuntimeRegistrationInput) => Promise<boolean>;
  activateYearly: (input: RuntimeRegistrationInput) => Promise<boolean>;
};

export const useRuntimeAccessStore = create<RuntimeAccessStore>((set) => ({
  status: null,
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    const result = await window.pos.runtime.getStatus();
    if (!result.success) {
      set({ loading: false, error: result.error.message });
      return null;
    }
    set({ status: result.data, loading: false });
    return result.data;
  },

  verify: async () => {
    set({ loading: true, error: null });
    const result = await window.pos.runtime.verify();
    if (!result.success) {
      set({ loading: false, error: result.error.message });
      return null;
    }
    set({ status: result.data, loading: false });
    return result.data;
  },

  startTrial: async (input) => performRegistration("trial", input, set),
  activateYearly: async (input) => performRegistration("paid", input, set)
}));

async function performRegistration(
  mode: "trial" | "paid",
  input: RuntimeRegistrationInput,
  set: (state: Partial<RuntimeAccessStore>) => void
): Promise<boolean> {
  set({ loading: true, error: null });
  const result = mode === "trial"
    ? await window.pos.runtime.startTrial(input)
    : await window.pos.runtime.activateYearly(input);

  if (!result.success) {
    set({ loading: false, error: result.error.message });
    return false;
  }

  const state: RuntimeAccessState = result.data;
  set({ status: { state, requiresActivation: !state.allowed, offline: false }, loading: false });
  return state.allowed;
}
