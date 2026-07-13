import { useEffect } from "react";
import { Button } from "../../components/ui/Button";
import { usePosStore } from "../../stores/pos-store";
import { useTableStore } from "../../stores/table-store";

export function TablesScreen() {
  const { floorMap, selectedFloor, setSelectedFloor, refresh, loading, error } = useTableStore();
  const { currentOrder, setOrderType, setTable } = usePosStore();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const activeFloor = selectedFloor ?? floorMap?.floors[0] ?? null;
  const tables = floorMap?.tables.filter((table) => table.floor === activeFloor) ?? [];

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-app-border bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold">Floor Management</h1>
            <p className="text-sm text-app-subtle">Assign tables for dine-in orders and keep the floor visible at a glance.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="h-10 px-3" onClick={() => void setOrderType("dine_in")}>
              Switch to Dine In
            </Button>
            <Button variant="secondary" className="h-10 px-3" onClick={() => void refresh()}>
              Refresh
            </Button>
          </div>
        </div>
      </section>

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
        {error && <div className="mb-3 text-sm text-red-700">{error}</div>}
        <div className="grid grid-cols-5 gap-3">
          {tables.map((table) => (
            <button
              key={table.uuid}
              className={`rounded-md border p-4 text-left ${
                currentOrder?.table?.uuid === table.uuid ? "border-app-primary bg-[#eef7f5]" : "border-app-border bg-app-bg"
              }`}
              onClick={() => void setTable(table.uuid)}
            >
              <div className="text-base font-extrabold">{table.name}</div>
              <div className="mt-1 text-sm text-app-subtle">{table.capacity} seats</div>
              <div className="mt-3 text-xs font-bold uppercase text-app-subtle">{table.status}</div>
            </button>
          ))}
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
