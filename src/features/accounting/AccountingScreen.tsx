import { useEffect, useState } from "react";
import type { FinanceDashboard, FinanceEntryType } from "../../../shared/contracts/accounting-contracts";
import { Button } from "../../components/ui/Button";
import { requirePosApi } from "../../utils/pos-api";
import { formatCurrency } from "../../utils/money";

export function AccountingScreen() {
  const [data, setData] = useState<FinanceDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<FinanceEntryType>("expense");
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const load = async () => {
    const result = await requirePosApi().accounting.dashboard();
    if (result.success) {
      setData(result.data);
      setError(null);
      if (!account && result.data.accounts[0]) setAccount(result.data.accounts[0].uuid);
    } else setError(result.error.message);
  };

  useEffect(() => { void load(); }, []);

  const save = async () => {
    const amountMinor = Math.round(Number(amount) * 100);
    if (!account || !description.trim() || !Number.isInteger(amountMinor) || amountMinor <= 0) return;
    const result = await requirePosApi().accounting.createEntry({
      entryDate: new Date().toISOString(), entryType: type, accountUuid: account,
      amountMinor, description, paymentMode: "cash"
    });
    if (result.success) { setAmount(""); setDescription(""); await load(); }
    else setError(result.error.message);
  };

  return <div className="space-y-4">
    <h1 className="text-2xl font-extrabold">Accounting & Finance</h1>
    {error && <div className="rounded-md bg-red-50 p-3 text-red-700">{error}</div>}
    {data && <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Card label="Income" value={formatCurrency(data.summary.incomeMinor)} />
        <Card label="Expenses" value={formatCurrency(data.summary.expenseMinor)} />
        <Card label="Net Profit" value={formatCurrency(data.summary.netProfitMinor)} />
        <Card label="Cash Book" value={formatCurrency(data.summary.cashBookMinor)} />
        <Card label="Supplier Paid" value={formatCurrency(data.summary.supplierPaymentsMinor)} />
        <Card label="Customer Receipts" value={formatCurrency(data.summary.customerReceiptsMinor)} />
      </div>
      <section className="grid gap-3 rounded-lg border border-app-border bg-white p-4 lg:grid-cols-[180px_220px_160px_1fr_auto]">
        <select className="h-11 rounded-md border border-app-border px-3" value={type} onChange={(e) => setType(e.target.value as FinanceEntryType)}>
          <option value="expense">Expense</option><option value="income">Income</option><option value="supplier_payment">Supplier Payment</option><option value="customer_receipt">Customer Receipt</option><option value="journal">Journal</option>
        </select>
        <select className="h-11 rounded-md border border-app-border px-3" value={account} onChange={(e) => setAccount(e.target.value)}>
          {data.accounts.filter((a) => a.isActive).map((a) => <option key={a.uuid} value={a.uuid}>{a.name}</option>)}
        </select>
        <input className="h-11 rounded-md border border-app-border px-3" type="number" min="0" step="0.01" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input className="h-11 rounded-md border border-app-border px-3" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Button onClick={() => void save()}>Post Entry</Button>
      </section>
      <section className="rounded-lg border border-app-border bg-white">
        <h2 className="border-b border-app-border p-4 text-lg font-extrabold">Recent Ledger</h2>
        <div className="divide-y divide-app-border">
          {data.recentEntries.map((entry) => <div key={entry.uuid} className="grid grid-cols-[150px_150px_1fr_140px] gap-3 p-3 text-sm">
            <span>{new Date(entry.entryDate).toLocaleDateString()}</span><span className="font-semibold">{entry.entryType.replaceAll("_", " ")}</span><span>{entry.description} · {entry.accountName}</span><strong className="text-right">{formatCurrency(entry.amountMinor)}</strong>
          </div>)}
          {!data.recentEntries.length && <div className="p-6 text-center text-app-subtle">No finance entries yet.</div>}
        </div>
      </section>
    </>}
  </div>;
}
function Card({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-app-border bg-white p-4"><div className="text-xs font-bold uppercase text-app-subtle">{label}</div><div className="mt-1 text-xl font-extrabold">{value}</div></div>; }
