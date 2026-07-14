import Store from "electron-store";
import type { AuthSession } from "../../shared/contracts/auth-contracts";

type SessionStoreShape = {
  currentSession?: AuthSession;
  rememberedTerminal?: {
    restaurantCode: string;
    outletCode: string;
    terminalCode: string;
  };
};

const store = new Store<SessionStoreShape>({
  name: "secure-session",
  clearInvalidConfig: true
});

export const sessionStore = {
  getSession(): AuthSession | null {
    return store.get("currentSession") ?? null;
  },
  setSession(session: AuthSession): void {
    store.set("currentSession", session);
  },
  clearSession(): void {
    store.delete("currentSession");
  },
  rememberTerminal(restaurantCode: string, outletCode: string, terminalCode: string): void {
    store.set("rememberedTerminal", { restaurantCode, outletCode, terminalCode });
  },
  getRememberedTerminal(): SessionStoreShape["rememberedTerminal"] | null {
    return store.get("rememberedTerminal") ?? null;
  }
};
