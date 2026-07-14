import { useEffect, useState } from "react";
import type { HeldOrderSummary } from "@shared/contracts/order-contracts";
import { Button } from "../../components/ui/Button";
import { usePosStore } from "../../stores/pos-store";
import { formatCurrency } from "../../utils/money";
import { getPosApi, getPreloadUnavailableMessage } from "../../utils/pos-api";

export function HeldOrdersScreen() {
  const { recall } = usePosStore();
  const [heldOrders, setHeldOrders] = useState<HeldOrderSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadHeldOrders();
  }, []);

  async function loadHeldOrders() {
    const api = getPosApi();
    if (!api) {
      setError(getPreloadUnavailableMessage());
      return;
    }

    const result = await api.orders.listHeld();
    if (!result.success) {
      setError(result.error.message);
      return;
    }

    setHeldOrders(result.data);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-app-border bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold">Held Orders</h1>
            <p className="text-sm text-app-subtle">Resume parked orders without rebuilding the cart.</p>
          </div>
          <Button variant="secondary" className="h-10 px-3" onClick={() => void loadHeldOrders()}>
            Refresh
          </Button>
        </div>
      </section>

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <section className="rounded-lg border border-app-border bg-white">
        {heldOrders.length === 0 ? (
          <div className="p-6 text-sm text-app-subtle">No held orders right now.</div>
        ) : (
          <div className="divide-y divide-app-border">
            {heldOrders.map((order) => (
              <div key={order.uuid} className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm font-extrabold">
                    {order.orderNo} • {order.orderType.replace("_", " ")}
                  </div>
                  <div className="mt-1 text-xs text-app-subtle">
                    {order.itemCount} items • {order.tableName ?? "No table"} • {order.customerName ?? "Walk-in"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-bold">{formatCurrency(order.grandTotalMinor)}</div>
                  <Button className="h-10 px-3" onClick={() => void recall(order.uuid)}>
                    Recall
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
