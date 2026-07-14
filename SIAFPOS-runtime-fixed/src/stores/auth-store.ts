import { create } from "zustand";
import type { AuthSession, PasswordLoginInput, PinLoginInput } from "@shared/contracts/auth-contracts";
import { getPosApi, getPreloadUnavailableMessage } from "../utils/pos-api";

type AuthState = {
  session: AuthSession | null;
  loading: boolean;
  error: string | null;
  restoreSession: () => Promise<void>;
  loginWithPassword: (input: PasswordLoginInput) => Promise<boolean>;
  loginWithPin: (input: PinLoginInput) => Promise<boolean>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  loading: false,
  error: null,
  restoreSession: async () => {
    const api = getPosApi();
    if (!api) {
      set({ loading: false, error: getPreloadUnavailableMessage() });
      return;
    }

    set({ loading: true, error: null });
    const result = await api.auth.getSession();
    if (result.success) {
      set({ session: result.data, loading: false });
      return;
    }
    set({ session: null, loading: false, error: result.error.message });
  },
  loginWithPassword: async (input) => {
    const api = getPosApi();
    if (!api) {
      set({ session: null, loading: false, error: getPreloadUnavailableMessage() });
      return false;
    }

    set({ loading: true, error: null });
    const result = await api.auth.loginWithPassword(input);
    if (result.success) {
      set({ session: result.data.session, loading: false });
      return true;
    }
    set({ session: null, loading: false, error: result.error.message });
    return false;
  },
  loginWithPin: async (input) => {
    const api = getPosApi();
    if (!api) {
      set({ session: null, loading: false, error: getPreloadUnavailableMessage() });
      return false;
    }

    set({ loading: true, error: null });
    const result = await api.auth.loginWithPin(input);
    if (result.success) {
      set({ session: result.data.session, loading: false });
      return true;
    }
    set({ session: null, loading: false, error: result.error.message });
    return false;
  },
  logout: async () => {
    const api = getPosApi();
    if (api) {
      await api.auth.logout();
    }
    set({ session: null, error: null });
  }
}));
