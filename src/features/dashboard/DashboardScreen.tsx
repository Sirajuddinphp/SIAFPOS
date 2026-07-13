import { StatusPill } from "../../components/common/StatusPill";
import { useAuthStore } from "../../stores/auth-store";
import { useSystemStore } from "../../stores/system-store";

export function DashboardScreen() {
  const session = useAuthStore((state) => state.session);
  const { appInfo, databaseHealth, connectivity, health } = useSystemStore();

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-app-border bg-white p-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-extrabold">Dashboard</h1>
            <p className="text-sm text-app-subtle">Phase 1 desktop foundation is active.</p>
            <p className="text-sm text-app-subtle">POS Core now runs locally with catalog, tables, held orders, and GST-aware draft totals.</p>
          </div>
          <div className="flex gap-2">
            <StatusPill label={connectivity?.isOnline ? "Online" : "Offline"} tone={connectivity?.isOnline ? "ok" : "warning"} />
            <StatusPill label={databaseHealth?.status === "ok" ? "Database OK" : "Database Error"} tone={databaseHealth?.status === "ok" ? "ok" : "error"} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-4">
        <InfoPanel title="Logged-in User" rows={[["Name", session?.user.name], ["Username", session?.user.username], ["Role", session?.user.role], ["Last Login", session?.user.lastLoginAt]]} />
        <InfoPanel title="Restaurant Context" rows={[["Restaurant", session?.restaurant.name], ["Outlet", session?.outlet.name], ["Terminal", session?.terminal.name], ["Terminal Status", session?.terminal.registrationStatus]]} />
        <InfoPanel title="Application Status" rows={[["Version", appInfo?.version], ["Environment", appInfo?.environment], ["Health", health?.status], ["Checked", health?.checkedAt]]} />
      </section>

      <section className="rounded-lg border border-app-border bg-white p-4">
        <h2 className="mb-3 text-sm font-extrabold uppercase text-app-subtle">Coming Next</h2>
        <div className="grid grid-cols-7 gap-2">
          {["POS", "Tables", "Held", "Running", "Kitchen", "Reports", "Settings"].map((item) => (
            <div key={item} className="rounded-md border border-app-border bg-app-bg px-3 py-4 text-center text-sm font-bold text-app-subtle">
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function InfoPanel({ title, rows }: { title: string; rows: Array<[string, string | null | undefined]> }) {
  return (
    <div className="rounded-lg border border-app-border bg-white p-4">
      <h2 className="mb-3 text-sm font-extrabold uppercase text-app-subtle">{title}</h2>
      <div className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 border-b border-app-border pb-2 text-sm last:border-b-0">
            <span className="text-app-subtle">{label}</span>
            <span className="max-w-[180px] truncate font-semibold">{value ?? "-"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
