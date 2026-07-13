import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { RunningOrderSummary } from "@shared/contracts/order-contracts";
import { Button } from "../../components/ui/Button";
import { usePosStore } from "../../stores/pos-store";
import { formatCurrency } from "../../utils/money";
import { getPosApi, getPreloadUnavailableMessage } from "../../utils/pos-api";

export function RunningOrdersScreen() {
  const navigate = useNavigate();
  const { loadSummary } = usePosStore();
  const [orders, setOrders] = useState<RunningOrderSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadRunningOrders();
  }, []);

  async function loadRunningOrders() {
    const api = getPosApi();
    if (!api) {
      setError(getPreloadUnavailableMessage());
      return;
    }

    const result = await api.orders.listRunning();
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    setOrders(result.data);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-app-border bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold">Running Orders</h1>
            <p className="text-sm text-app-subtle">Open and continue any active editable order from the queue.</p>
          </div>
          <Button variant="secondary" className="h-10 px-3" onClick={() => void loadRunningOrders()}>
            Refresh
          </Button>
        </div>
      </section>

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <section className="rounded-lg border border-app-border bg-white">
        {orders.length === 0 ? (
          <div className="p-6 text-sm text-app-subtle">No running orders yet.</div>
        ) : (
          <div className="divide-y divide-app-border">
            {orders.map((order) => (
              <div key={order.uuid} className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm font-extrabold">
                    {order.orderNo} • {order.orderType.replace("_", " ")}
                  </div>
                  <div className="mt-1 text-xs text-app-subtle">
                    {order.itemCount} items • {order.tableName ?? "No table"} • {order.waiterName ?? "No waiter"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-bold">{formatCurrency(order.grandTotalMinor)}</div>
                  <Button variant="secondary" className="h-10 px-3" onClick={() => void loadSummary(order.uuid)}>Open</Button>
                  <Button className="h-10 px-3" onClick={() => navigate(`/billing?orderUuid=${order.uuid}`)}>Bill</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
