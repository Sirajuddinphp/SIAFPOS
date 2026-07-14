import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DiningTableSummary } from "@shared/contracts/table-contracts";
import { Button } from "../../components/ui/Button";
import { usePosStore } from "../../stores/pos-store";
import { useTableStore } from "../../stores/table-store";

export function TablesScreen() {
  const navigate = useNavigate();
  const { floorMap, selectedFloor, setSelectedFloor, refresh, loading, error } = useTableStore();
  const { currentOrder, createNewOrder, loadSummary, setOrderType, setTable } = usePosStore();
  const [actionError, setActionError] = useState<string | null>(null);
  const [openingTableUuid, setOpeningTableUuid] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const activeFloor = selectedFloor ?? floorMap?.floors[0] ?? null;
  const tables = floorMap?.tables.filter((table) => table.floor === activeFloor) ?? [];

  async function openTable(table: DiningTableSummary) {
    setOpeningTableUuid(table.uuid);
    setActionError(null);

    try {
      if (table.activeOrderUuid) {
        await loadSummary(table.activeOrderUuid);
        const state = usePosStore.getState();
        if (!state.currentOrder || state.currentOrder.uuid !== table.activeOrderUuid) {
          throw new Error(state.error ?? "Unable to open the table order.");
        }
        navigate("/pos");
        return;
      }

      const shouldCreateNewOrder =
        !currentOrder ||
        currentOrder.items.length > 0 ||
        (currentOrder.table && currentOrder.table.uuid !== table.uuid);

      if (shouldCreateNewOrder) {
        const created = await createNewOrder("dine_in");
        if (!created) {
          throw new Error(usePosStore.getState().error ?? "Unable to create a dine-in order.");
        }
      } else if (currentOrder.orderType !== "dine_in") {
        await setOrderType("dine_in");
      }

      await setTable(table.uuid);
      const state = usePosStore.getState();
      if (state.error || state.currentOrder?.table?.uuid !== table.uuid) {
        throw new Error(state.error ?? "Unable to assign the selected table.");
      }

      await refresh();
      navigate("/pos");
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Unable to open this table.");
    } finally {
      setOpeningTableUuid(null);
    }
  }

  return (
    <div className="min-h-full space-y-4 pb-4">
      <section className="rounded-lg border border-app-border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold">Floor Management</h1>
            <p className="text-sm text-app-subtle">
              Select an available table to start a dine-in order. Select an occupied table to reopen its running order.
            </p>
          </div>
          <Button variant="secondary" className="h-10 px-3" onClick={() => void refresh()}>
            Refresh
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-app-subtle">
          <Legend label="Available" className="border-app-border bg-app-bg" />
          <Legend label="Occupied" className="border-app-primary bg-[#eef7f5]" />
          <span>After selecting a table, choose a waiter from the POS screen before sending KOT.</span>
        </div>
      </section>

      {(error || actionError) && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError ?? error}</div>
      )}

      <section className="rounded-lg border border-app-border bg-white p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {floorMap?.floors.map((floor) => (
            <button
              key={floor}
              className={`rounded-md px-4 py-2 text-sm font-semibold ${
                floor === activeFloor ? "bg-app-primary text-white" : "bg-app-muted text-app-text"
              }`}
              onClick={() => setSelectedFloor(floor)}
            >
              {floor}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {tables.map((table) => {
            const occupied = Boolean(table.activeOrderUuid);
            const selected = currentOrder?.table?.uuid === table.uuid;
            return (
              <button
                key={table.uuid}
                disabled={openingTableUuid !== null}
                className={`rounded-md border p-4 text-left transition hover:border-app-primary disabled:cursor-wait disabled:opacity-60 ${
                  selected || occupied ? "border-app-primary bg-[#eef7f5]" : "border-app-border bg-app-bg"
                }`}
                onClick={() => void openTable(table)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-base font-extrabold">{table.name}</div>
                  {openingTableUuid === table.uuid && <span className="text-xs text-app-subtle">Opening…</span>}
                </div>
                <div className="mt-1 text-sm text-app-subtle">{table.capacity} seats</div>
                <div className={`mt-3 text-xs font-bold uppercase ${occupied ? "text-app-primary" : "text-app-subtle"}`}>
                  {occupied ? "occupied" : table.status}
                </div>
                <div className="mt-1 text-xs text-app-subtle">{occupied ? "Open running order" : "Start dine-in order"}</div>
              </button>
            );
          })}
        </div>

        {!loading && tables.length === 0 && (
          <div className="rounded-md border border-dashed border-app-border bg-app-bg p-6 text-sm text-app-subtle">
            No tables are configured for this floor.
          </div>
        )}
      </section>
    </div>
  );
}

function Legend({ label, className }: { label: string; className: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-3 w-3 rounded border ${className}`} />
      {label}
    </span>
  );
}
