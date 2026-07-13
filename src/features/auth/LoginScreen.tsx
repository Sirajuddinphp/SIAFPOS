import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { StatusPill } from "../../components/common/StatusPill";
import { useAuthStore } from "../../stores/auth-store";
import { useSystemStore } from "../../stores/system-store";

type LoginMode = "password" | "pin";

export function LoginScreen() {
  const navigate = useNavigate();
  const { appInfo, databaseHealth, connectivity, refresh } = useSystemStore();
  const { loginWithPassword, loginWithPin, error, loading, session } = useAuthStore();
  const [mode, setMode] = useState<LoginMode>("password");
  const [restaurantCode, setRestaurantCode] = useState("MH5-DEMO");
  const [outletCode, setOutletCode] = useState("MAIN");
  const [terminalCode, setTerminalCode] = useState("POS-01");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [rememberTerminal, setRememberTerminal] = useState(true);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (session) {
      navigate(session.user.role === "waiter" ? "/tables" : "/pos", { replace: true });
    }
  }, [navigate, session]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const success =
      mode === "password"
        ? await loginWithPassword({ restaurantCode, outletCode, terminalCode, username, password, rememberTerminal })
        : await loginWithPin({ restaurantCode, outletCode, terminalCode, pin, rememberTerminal });

    if (success) {
      const activeSession = useAuthStore.getState().session;
      navigate(activeSession?.user.role === "waiter" ? "/tables" : "/pos", { replace: true });
    }
  }

  return (
    <section className="grid w-[920px] grid-cols-[360px_1fr] overflow-hidden rounded-lg border border-app-border bg-white shadow-sm">
      <aside className="border-r border-app-border bg-app-bg p-6">
        <div className="text-2xl font-extrabold">MealHi5 POS</div>
        <p className="mt-2 text-sm leading-6 text-app-subtle">
          Secure offline desktop foundation for restaurant operations.
        </p>
        <div className="mt-6 space-y-2">
          <StatusPill label={connectivity?.isOnline ? "Internet online" : "Offline mode"} tone={connectivity?.isOnline ? "ok" : "warning"} />
          <div />
          <StatusPill
            label={databaseHealth?.status === "ok" ? "SQLite ready" : "SQLite unavailable"}
            tone={databaseHealth?.status === "ok" ? "ok" : "error"}
          />
        </div>
        <div className="mt-8 text-xs text-app-subtle">Version {appInfo?.version ?? "0.1.0"}</div>
      </aside>

      <form className="p-6" onSubmit={(event) => void onSubmit(event)}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold">Staff Login</h1>
            <p className="text-sm text-app-subtle">Use demo admin/admin123 or PIN 1234 in development.</p>
          </div>
          <div className="rounded-md bg-app-muted p-1">
            <button
              type="button"
              className={`rounded px-3 py-2 text-sm font-semibold ${mode === "password" ? "bg-white text-app-text shadow-sm" : "text-app-subtle"}`}
              onClick={() => setMode("password")}
            >
              Password
            </button>
            <button
              type="button"
              className={`rounded px-3 py-2 text-sm font-semibold ${mode === "pin" ? "bg-white text-app-text shadow-sm" : "text-app-subtle"}`}
              onClick={() => setMode("pin")}
            >
              PIN
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <TextInput label="Restaurant Code" value={restaurantCode} onChange={setRestaurantCode} />
          <TextInput label="Outlet" value={outletCode} onChange={setOutletCode} />
          <TextInput label="Terminal" value={terminalCode} onChange={setTerminalCode} />
        </div>

        {mode === "password" ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <TextInput label="Username" value={username} onChange={setUsername} />
            <TextInput label="Password" value={password} onChange={setPassword} type="password" autoFocus />
          </div>
        ) : (
          <div className="mt-4">
            <TextInput label="PIN" value={pin} onChange={setPin} type="password" autoFocus />
          </div>
        )}

        <label className="mt-4 flex items-center gap-2 text-sm text-app-subtle">
          <input
            type="checkbox"
            checked={rememberTerminal}
            onChange={(event) => setRememberTerminal(event.target.checked)}
          />
          Remember this terminal context
        </label>

        {error && <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="mt-5 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => void refresh()}>
            Refresh Status
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
  autoFocus = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-app-subtle">{label}</span>
      <input
        className="h-11 w-full rounded-md border border-app-border px-3 text-sm outline-none focus:border-app-primary"
        value={value}
        type={type}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
