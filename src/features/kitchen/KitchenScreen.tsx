import { useEffect, useMemo } from "react";
import type { KotStatus } from "@shared/contracts/kot-contracts";
import { Button } from "../../components/ui/Button";
import { useKotStore } from "../../stores/kot-store";

const statusOrder: KotStatus[] = ["new", "preparing", "ready", "completed"];

export function KitchenScreen() {
  const {
    kitchenTickets,
    selectedTicket,
    loadKitchenQueue,
    loadTicket,
    markStarted,
    markReady,
    markCompleted,
    cancelKot,
    reprintKot,
    error,
    loading
  } = useKotStore();

  useEffect(() => {
    void loadKitchenQueue();
  }, [loadKitchenQueue]);

  const grouped = useMemo(
    () =>
      statusOrder.map((status) => ({
        status,
        tickets: kitchenTickets.filter((ticket) => ticket.status === status && !ticket.cancelledAt)
      })),
    [kitchenTickets]
  );

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_360px] gap-4">
      <section className="min-h-0 rounded-lg border border-app-border bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold">Kitchen Queue</h1>
            <p className="text-sm text-app-subtle">Track KOT progress and handle delta kitchen tickets locally.</p>
          </div>
          <Button variant="secondary" className="h-10 px-3" onClick={() => void loadKitchenQueue()}>
            Refresh
          </Button>
        </div>

        {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-4 gap-3">
          {grouped.map((group) => (
            <div key={group.status} className="rounded-lg border border-app-border bg-app-bg p-3">
              <div className="mb-3 text-sm font-extrabold uppercase">{group.status}</div>
              <div className="space-y-2">
                {group.tickets.length === 0 ? (
                  <div className="rounded-md border border-dashed border-app-border bg-white p-3 text-xs text-app-subtle">No tickets</div>
                ) : (
                  group.tickets.map((ticket) => (
                    <button
                      key={ticket.uuid}
                      className={`w-full rounded-md border bg-white p-3 text-left ${selectedTicket?.uuid === ticket.uuid ? "border-app-primary" : "border-app-border"}`}
                      onClick={() => void loadTicket(ticket.uuid)}
                    >
                      <div className="text-sm font-bold">{ticket.orderNo}</div>
                      <div className="mt-1 text-xs text-app-subtle">
                        {ticket.kind} • {ticket.itemCount} items
                      </div>
                      <div className="mt-1 text-xs text-app-subtle">
                        {ticket.tableName ?? "No table"} • {ticket.waiterName ?? "No waiter"}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="min-h-0 rounded-lg border border-app-border bg-white p-4">
        <div className="mb-3 text-lg font-extrabold">KOT Detail</div>
        {!selectedTicket ? (
          <div className="rounded-md border border-dashed border-app-border bg-app-bg p-6 text-sm text-app-subtle">
            Select a kitchen ticket to manage status or reprint audit entries.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border border-app-border bg-app-bg p-3">
              <div className="text-sm font-bold">
                {selectedTicket.orderNo} • {selectedTicket.kind}
              </div>
              <div className="mt-1 text-xs text-app-subtle">
                {selectedTicket.orderType.replace("_", " ")} • {selectedTicket.tableName ?? "No table"} • {selectedTicket.waiterName ?? "No waiter"}
              </div>
              <div className="mt-1 text-xs text-app-subtle">Status: {selectedTicket.status}</div>
            </div>

            <div className="space-y-2">
              {selectedTicket.items.map((item) => (
                <div key={item.uuid} className="rounded-md border border-app-border bg-app-bg p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold">
                      {item.itemName}
                      {item.variantName ? ` • ${item.variantName}` : ""}
                    </div>
                    <div className="text-xs font-extrabold uppercase">{item.lineAction}</div>
                  </div>
                  <div className="mt-1 text-xs text-app-subtle">Qty: {item.qty}</div>
                  <div className="mt-1 text-xs text-app-subtle">{item.modifierNames.join(", ") || "No add-ons"}</div>
                  {item.kitchenNote && <div className="mt-1 text-xs text-app-info">Note: {item.kitchenNote}</div>}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" className="h-10 px-3" onClick={() => void markStarted(selectedTicket.uuid)} disabled={selectedTicket.status !== "new" || Boolean(selectedTicket.cancelledAt) || loading}>
                Start
              </Button>
              <Button variant="secondary" className="h-10 px-3" onClick={() => void markReady(selectedTicket.uuid)} disabled={selectedTicket.status !== "preparing" || Boolean(selectedTicket.cancelledAt) || loading}>
                Ready
              </Button>
              <Button variant="secondary" className="h-10 px-3" onClick={() => void markCompleted(selectedTicket.uuid)} disabled={selectedTicket.status !== "ready" || Boolean(selectedTicket.cancelledAt) || loading}>
                Complete
              </Button>
              <Button variant="secondary" className="h-10 px-3" onClick={() => void reprintKot(selectedTicket.uuid)} disabled={loading}>
                Reprint
              </Button>
              <Button variant="danger" className="h-10 px-3" onClick={() => void cancelKot(selectedTicket.uuid, "Cancelled from kitchen")} disabled={selectedTicket.status !== "new" || Boolean(selectedTicket.cancelledAt) || loading}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
