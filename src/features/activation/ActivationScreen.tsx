import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { useActivationStore } from "../../stores/activation-store";

export function ActivationScreen() {
  const navigate = useNavigate();
  const { activate, loading, error } = useActivationStore();
  const [restaurantCode, setRestaurantCode] = useState("");
  const [licenseKey, setLicenseKey] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerMobile, setOwnerMobile] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const activated = await activate({ restaurantCode, licenseKey, ownerEmail, ownerMobile });
    if (activated) navigate("/login", { replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-app-bg p-6">
      <form onSubmit={submit} className="w-full max-w-xl rounded-xl border border-app-border bg-white p-7 shadow-sm">
        <div className="mb-6">
          <div className="text-2xl font-extrabold text-app-text">Activate MealHi5 POS</div>
          <p className="mt-1 text-sm text-app-subtle">Internet is required only for first activation. A valid license, subscription and device registration are mandatory.</p>
        </div>

        <div className="grid gap-4">
          <Field label="Restaurant Code" value={restaurantCode} onChange={setRestaurantCode} autoFocus />
          <Field label="License Key" value={licenseKey} onChange={setLicenseKey} type="password" />
          <Field label="Owner Email" value={ownerEmail} onChange={setOwnerEmail} type="email" />
          <Field label="Owner Mobile" value={ownerMobile} onChange={setOwnerMobile} />
        </div>

        {error && <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <Button type="submit" className="mt-6 w-full" disabled={loading}>
          {loading ? "Activating…" : "Activate Software"}
        </Button>
      </form>
    </main>
  );
}

function Field({ label, value, onChange, type = "text", autoFocus = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; autoFocus?: boolean }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-app-text">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoFocus={autoFocus}
        required
        className="h-11 rounded-md border border-app-border bg-white px-3 font-normal outline-none focus:border-app-primary"
      />
    </label>
  );
}
