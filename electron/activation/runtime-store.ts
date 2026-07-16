import Store from "electron-store";
import type { RuntimeAccessState } from "../../shared/contracts/runtime-access-contracts";

type RuntimeStoreShape = { runtime?: RuntimeAccessState };

const store = new Store<RuntimeStoreShape>({
  name: "runtime-access",
  encryptionKey: "mealhi5-pos-runtime-v1",
  clearInvalidConfig: true,
});

export function getRuntimeState(): RuntimeAccessState | null {
  return store.get("runtime") ?? null;
}

export function saveRuntimeState(state: RuntimeAccessState): void {
  store.set("runtime", state);
}

export function clearRuntimeState(): void {
  store.delete("runtime");
}
