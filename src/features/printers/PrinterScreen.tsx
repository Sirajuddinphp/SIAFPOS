import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { usePrinterStore } from "../../stores/printer-store";
import type { PrinterConnectionType, PrinterRole } from "../../../shared/contracts/printer-contracts";

export function PrinterScreen() {
  const store = usePrinterStore();
  const [form, setForm] = useState({
    name: "Mock Receipt",
    role: "receipt" as PrinterRole,
    connectionType: "mock" as PrinterConnectionType,
    host: "",
    port: "9100",
    devicePath: "",
    paperWidthMm: 80 as 58 | 80
  });
  const [message, setMessage] = useState("");

  useEffect(() => { void store.load(); }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <section className="rounded-lg border bg-white p-4">
        <h1 className="text-xl font-extrabold">Printers</h1>
        <div className="mt-4 space-y-3">
          <input className="w-full rounded border p-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="w-full rounded border p-2" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as PrinterRole })}>
            <option value="receipt">Receipt</option><option value="kitchen">Kitchen</option><option value="bar">Bar</option><option value="cashier">Cashier</option>
          </select>
          <select className="w-full rounded border p-2" value={form.connectionType} onChange={(e) => setForm({ ...form, connectionType: e.target.value as PrinterConnectionType })}>
            <option value="mock">Mock</option><option value="lan">LAN ESC/POS</option><option value="usb">USB/shared path</option>
          </select>
          {form.connectionType === "lan" && <div className="grid grid-cols-[1fr_90px] gap-2"><input className="rounded border p-2" placeholder="192.168.1.50" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })}/><input className="rounded border p-2" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })}/></div>}
          {form.connectionType === "usb" && <input className="w-full rounded border p-2" placeholder="Device/shared printer path" value={form.devicePath} onChange={(e) => setForm({ ...form, devicePath: e.target.value })}/>} 
          <select className="w-full rounded border p-2" value={form.paperWidthMm} onChange={(e) => setForm({ ...form, paperWidthMm: Number(e.target.value) as 58 | 80 })}><option value="80">80mm</option><option value="58">58mm</option></select>
          <Button className="w-full" onClick={async () => {
            const ok = await store.save({ ...form, host: form.host || null, port: form.connectionType === "lan" ? Number(form.port) : null, devicePath: form.devicePath || null, charactersPerLine: form.paperWidthMm === 80 ? 48 : 32, autoCut: true, openCashDrawer: form.role === "receipt", isDefault: true, isActive: true });
            setMessage(ok ? "Printer saved." : "");
          }}>Save printer</Button>
          {message && <div className="text-sm text-green-700">{message}</div>}{store.error && <div className="text-sm text-red-600">{store.error}</div>}
        </div>
      </section>
      <section className="space-y-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="flex justify-between"><h2 className="font-bold">Configured printers</h2><Button variant="secondary" onClick={() => void store.process()}>Process queue</Button></div>
          <div className="mt-3 space-y-2">{store.printers.map((printer) => <div key={printer.uuid} className="flex items-center justify-between rounded border p-3"><div><b>{printer.name}</b><div className="text-xs text-app-subtle">{printer.role} · {printer.connectionType} · {printer.paperWidthMm}mm</div></div><div className="flex gap-2"><Button variant="secondary" onClick={async () => { const r = await store.diagnose(printer.uuid); if (r) setMessage(r.message); }}>Check</Button><Button onClick={() => void store.test(printer.uuid)}>Test</Button>{printer.openCashDrawer && <Button variant="ghost" onClick={() => void store.drawer(printer.uuid)}>Drawer</Button>}</div></div>)}{!store.printers.length && <div className="text-sm text-app-subtle">No printer configured.</div>}</div>
        </div>
        <div className="rounded-lg border bg-white p-4"><h2 className="font-bold">Print queue</h2><div className="mt-3 space-y-2">{store.jobs.map((job) => <div key={job.uuid} className="flex justify-between rounded border p-2 text-sm"><span>{job.documentType} · {job.jobKind} · {job.printerName ?? "Unassigned"}</span><span>{job.status}{job.errorMessage ? ` · ${job.errorMessage}` : ""}{job.status === "failed" && <button className="ml-2 underline" onClick={() => void store.retry(job.uuid)}>Retry</button>}</span></div>)}</div></div>
      </section>
    </div>
  );
}
