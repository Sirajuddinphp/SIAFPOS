import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatusPill } from "../../components/common/StatusPill";
import { Button } from "../../components/ui/Button";
import { useAuthStore } from "../../stores/auth-store";
import { useActivationStore } from "../../stores/activation-store";
import { useSystemStore } from "../../stores/system-store";

export function StartupScreen() {
  const navigate = useNavigate();
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const loadActivation = useActivationStore((state) => state.load);
  const { appInfo, health, databaseHealth, refresh, error } = useSystemStore();
  const [startupFailed, setStartupFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function boot() {
      try {
        await refresh();
        const activation = await loadActivation();
        if (!activation.activated) {
          navigate("/activation", { replace: true });
          return;
        }
        await restoreSession();
        if (!mounted) {
          return;
        }
        const restoredSession = useAuthStore.getState().session;
        window.setTimeout(() => {
          navigate(
            restoredSession ? (restoredSession.user.role === "waiter" ? "/tables" : "/pos") : "/login",
            { replace: true }
          );
        }, 700);
      } catch {
        if (mounted) {
          setStartupFailed(true);
        }
      }
    }
    void boot();
    return () => {
      mounted = false;
    };
  }, [loadActivation, navigate, refresh, restoreSession]);

  return (
    <main className="flex h-screen w-screen items-center justify-center bg-app-bg">
      <section className="w-[560px] rounded-lg border border-app-border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <div className="text-2xl font-extrabold text-app-text">MealHi5 POS</div>
          <div className="text-sm text-app-subtle">Starting secure activated desktop POS</div>
        </div>

        <div className="space-y-3">
          <HealthRow label="Application" value={appInfo ? `v${appInfo.version}` : "Loading"} ok={Boolean(appInfo)} />
          <HealthRow
            label="Database"
            value={databaseHealth?.message ?? "Checking SQLite"}
            ok={databaseHealth?.status === "ok"}
          />
          <HealthRow
            label="Migrations"
            value={health?.migrations.message ?? "Checking migrations"}
            ok={health?.migrations.status === "ok"}
          />
          <HealthRow
            label="Terminal"
            value={health?.terminal.message ?? "Checking terminal"}
            ok={health?.terminal.status === "ok"}
          />
        </div>

        {(startupFailed || error) && (
          <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error ?? "Startup failed. Please restart the application or contact support."}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <StatusPill label={startupFailed ? "Startup failed" : "Initializing"} tone={startupFailed ? "error" : "warning"} />
          <Button variant="secondary" onClick={() => void refresh()}>
            Retry
          </Button>
        </div>
      </section>
    </main>
  );
}

function HealthRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-app-border bg-app-bg px-3 py-2">
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-app-subtle">{value}</div>
      </div>
      <StatusPill label={ok ? "OK" : "Pending"} tone={ok ? "ok" : "warning"} />
    </div>
  );
}
