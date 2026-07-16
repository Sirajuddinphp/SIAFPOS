import Store from "electron-store";
import type { ActivationRecord } from "../../shared/contracts/activation-contracts";

type ActivationStoreShape = { activation?: ActivationRecord };

const store = new Store<ActivationStoreShape>({
  name: "activation",
  clearInvalidConfig: true
});

export function getActivationRecord(): ActivationRecord | null {
  return store.get("activation") ?? null;
}

export function saveActivationRecord(record: ActivationRecord): void {
  store.set("activation", record);
}

export function clearActivationRecord(): void {
  store.delete("activation");
}

export function isActivated(): boolean {
  const record = getActivationRecord();
  return record?.status === "activated";
}