import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { useRuntimeAccessStore } from "../../stores/runtime-access-store";

export function RuntimeAccessScreen() {
  const navigate = useNavigate();
  const { startTrial, activateYearly, loading, error } = useRuntimeAccessStore();
  const [mode, setMode] = useState<"trial" | "paid">("paid");
  const [restaurantCode, setRestaurantCode] = useState("");
  const [licenseKey, setLicenseKey] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerMobile, setOwnerMobile] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const input = { restaurantCode, ownerEmail, ownerMobile, licenseKey: mode === "paid" ? licenseKey : undefined };
    const allowed = mode === "trial" ? await startTrial(input) : await activateYearly(input);
    if (allowed) navigate("/login", { replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-app-bg p-6">
      <form onSubmit={submit} className="w-full max-w-xl rounded-xl border border-app-border bg-white p-7 shadow-sm">
        <div className="mb-5">
          <div className="text-2xl font-extrabold text-app-text">MealHi5 POS Access</div>
          <p className="mt-1 text-sm text-app-subtle">Start a trial or activate your yearly runtime license.</p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-lg bg-app-bg p-1">
          <button type="button" onClick={() => setMode("trial")} className={`rounded-md px-3 py-2 text-sm font-bold ${mode === "trial" ? "bg-white shadow-sm" : "text-app-subtle"}`}>15-Day Trial</button>
          <button type="button" onClick={() => setMode("paid")} className={`rounded-md px-3 py-2 text-sm font-bold ${mode === "paid" ? "bg-white shadow-sm" : "text-app-subtle"}`}>Yearly License</button>
        </div>

        <div className="grid gap-4">
          <Field label="Restaurant Code" value={restaurantCode} onChange={setRestaurantCode} autoFocus />
          {mode === "paid" && <Field label="License Key" value={licenseKey} onChange={setLicenseKey} type="password" />}
          <Field label="Owner Email" value={ownerEmail} onChange={setOwnerEmail} type="email" />
          <Field label="Owner Mobile" value={ownerMobile} onChange={setOwnerMobile} />
        </div>

        {error && <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <Button type="submit" className="mt-6 w-full" disabled={loading}>
          {loading ? "Verifying…" : mode === "trial" ? "Start Trial" : "Activate Yearly License"}
        </Button>
      </form>
    </main>
  );
}

function Field({ label, value, onChange, type = "text", autoFocus = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; autoFocus?: boolean }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-app-text">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} autoFocus={autoFocus} required className="h-11 rounded-md border border-app-border bg-white px-3 font-normal outline-none focus:border-app-primary" />
    </label>
  );
}
