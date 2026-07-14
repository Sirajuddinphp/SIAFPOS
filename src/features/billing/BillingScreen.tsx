import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { PaymentMode } from "../../../shared/contracts/billing-contracts";
import { Button } from "../../components/ui/Button";
import { useBillingStore } from "../../stores/billing-store";
import { usePosStore } from "../../stores/pos-store";
import { useShiftStore } from "../../stores/shift-store";

const money = (minor: number) => `₹${(minor / 100).toFixed(2)}`;

export function BillingScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orderUuid = params.get("orderUuid") ?? "";
  const { bill, loading, error, preview, settle, print, clear } = useBillingStore();
  const { shift, load: loadShift } = useShiftStore();
  const loadSummary = usePosStore((state) => state.loadSummary);
  const [mode, setMode] = useState<PaymentMode>("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    clear();
    setMessage("");
    setCashReceived("");
    void loadShift();
    if (orderUuid) {
      void preview(orderUuid);
    }
  }, [clear, loadShift, orderUuid, preview]);

  const total = bill?.grandTotalMinor ?? 0;
  const received = Math.round(Number(cashReceived || 0) * 100);
  const change = useMemo(() => Math.max(0, received - total), [received, total]);

  async function returnToOrder() {
    if (!orderUuid) {
      navigate("/orders/running");
      return;
    }
    await loadSummary(orderUuid);
    const state = usePosStore.getState();
    navigate(state.currentOrder?.uuid === orderUuid ? "/pos" : "/orders/running");
  }

  if (!orderUuid) {
    return (
      <div className="rounded-lg border border-app-border bg-white p-5">
        <h1 className="text-xl font-extrabold">Billing</h1>
        <p className="mt-2 text-sm text-app-subtle">Open Billing from a running order that contains at least one item.</p>
        <Button className="mt-4" onClick={() => navigate("/orders/running")}>
          View Running Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold">Billing</h1>
          <p className="text-sm text-app-subtle">Review the order, collect payment, and queue the receipt.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void returnToOrder()}>
            Back to Order
          </Button>
          <Button variant="secondary" onClick={() => navigate("/orders/running")}>
            Running Orders
          </Button>
        </div>
      </div>

      {loading && !bill && <div className="rounded-lg border border-app-border bg-white p-5 text-sm text-app-subtle">Loading bill…</div>}

      {error && !bill && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-5">
          <div className="font-bold text-red-700">Unable to open this bill</div>
          <div className="mt-1 text-sm text-red-700">{error}</div>
          <Button variant="secondary" className="mt-4" onClick={() => void returnToOrder()}>
            Return to Order
          </Button>
        </div>
      )}

      {bill && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-lg border border-app-border bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold">Bill {bill.orderNo}</h2>
                <div className="mt-1 text-xs uppercase text-app-subtle">Status: {bill.status}</div>
              </div>
              {"billNo" in bill && <div className="text-sm font-bold">{bill.billNo}</div>}
            </div>
            <div className="mt-5 space-y-3">
              <Row label="Subtotal" value={money(bill.subtotalMinor)} />
              <Row label="Discount" value={`-${money(bill.discountMinor)}`} />
              <Row label="Taxable" value={money(bill.taxableMinor)} />
              <Row label="GST" value={money(bill.taxMinor)} />
              <Row label="Grand total" value={money(total)} strong />
            </div>
            {bill.status === "settled" && (
              <div className="mt-5 rounded-md bg-green-50 p-3 font-bold text-green-700">Payment complete</div>
            )}
          </section>

          <aside className="rounded-lg border border-app-border bg-white p-5">
            <h2 className="font-bold">Payment</h2>
            {!shift && (
              <div className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                Open a cashier shift before settlement.
                <Button variant="secondary" className="mt-3 w-full" onClick={() => navigate("/shift")}>
                  Open Shift
                </Button>
              </div>
            )}

            {bill.status !== "settled" && (
              <>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {(["cash", "upi", "card"] as PaymentMode[]).map((paymentMode) => (
                    <button
                      key={paymentMode}
                      className={`rounded-md border p-2 text-sm font-bold uppercase ${
                        mode === paymentMode ? "border-app-primary bg-app-muted" : "border-app-border"
                      }`}
                      onClick={() => setMode(paymentMode)}
                    >
                      {paymentMode}
                    </button>
                  ))}
                </div>

                {mode === "cash" && (
                  <>
                    <label className="mt-4 block text-sm">Cash received (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="mt-1 w-full rounded-md border border-app-border p-2"
                      value={cashReceived}
                      onChange={(event) => setCashReceived(event.target.value)}
                    />
                    <div className="mt-2 text-sm">
                      Change: <b>{money(change)}</b>
                    </div>
                  </>
                )}
              </>
            )}

            {error && <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            {message && <div className="mt-3 rounded-md bg-green-50 p-3 text-sm text-green-700">{message}</div>}

            {bill.status !== "settled" ? (
              <Button
                className="mt-5 w-full"
                disabled={loading || !shift || (mode === "cash" && received < total)}
                onClick={async () => {
                  const ok = await settle(orderUuid, [
                    {
                      mode,
                      amountMinor: total,
                      receivedMinor: mode === "cash" ? received : undefined
                    }
                  ]);
                  if (ok) {
                    setMessage("Bill settled successfully.");
                  }
                }}
              >
                {loading ? "Processing…" : `Settle ${money(total)}`}
              </Button>
            ) : (
              <Button
                className="mt-5 w-full"
                disabled={loading}
                onClick={async () => {
                  const result = await print();
                  if (result) {
                    setMessage(`${result.copyType} receipt queued.`);
                  }
                }}
              >
                Queue Receipt
              </Button>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between border-b border-app-border pb-2 ${strong ? "text-lg font-extrabold" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
