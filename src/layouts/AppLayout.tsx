import { useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { StatusPill } from "../components/common/StatusPill";
import { useAuthStore } from "../stores/auth-store";
import { useSystemStore } from "../stores/system-store";

export function AppLayout() {
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);
  const { appInfo, databaseHealth, connectivity, refresh } = useSystemStore();

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  return (
    <div className="grid h-dvh min-h-0 grid-cols-[190px_minmax(0,1fr)] overflow-hidden bg-app-bg text-app-text">
      <aside className="flex min-h-0 flex-col overflow-hidden border-r border-app-border bg-white">
        <div className="shrink-0 border-b border-app-border px-4 py-4">
          <div className="text-lg font-extrabold">MealHi5 POS</div>
          <div className="text-xs text-app-subtle">Restaurant desktop</div>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
          <SidebarLink to="/dashboard" label="Dashboard" />
          <SidebarLink to="/pos" label="POS" />
          <SidebarLink to="/tables" label="Tables" />
          <SidebarLink to="/orders/held" label="Held Orders" />
          <SidebarLink to="/orders/running" label="Running Orders" />
          <SidebarLink to="/kitchen" label="Kitchen" />
          <SidebarLink to="/shift" label="Shift" />
          <SidebarLink to="/billing" label="Billing" />
          <SidebarLink to="/printers" label="Printers" />
          <SidebarLink to="/sync" label="Cloud Sync" />
          <SidebarLink to="/customers" label="Customers" />
          <SidebarLink to="/menu-management" label="Menu Management" />
          <SidebarLink to="/inventory" label="Inventory" />
          <SidebarLink to="/outlets" label="Outlets & Transfers" />
          <SidebarLink to="/staff" label="Staff & HR" />
          <SidebarLink to="/reports" label="Reports" />
          <SidebarLink to="/settings" label="Settings" />
        </nav>
      </aside>
      <section className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-app-border bg-white px-4">
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">
              {session?.restaurant.name} / {session?.outlet.name}
            </div>
            <div className="truncate text-xs text-app-subtle">
              {session?.terminal.name} · {session?.user.name} ({session?.user.role})
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill label={connectivity?.isOnline ? "Online" : "Offline"} tone={connectivity?.isOnline ? "ok" : "warning"} />
            <StatusPill
              label={databaseHealth?.status === "ok" ? "SQLite OK" : "SQLite Check"}
              tone={databaseHealth?.status === "ok" ? "ok" : "error"}
            />
            <span className="tabular text-xs text-app-subtle">{new Date().toLocaleString()}</span>
            <span className="text-xs text-app-subtle">v{appInfo?.version ?? "0.1.0"}</span>
            <Button variant="secondary" className="h-9 px-3" onClick={() => void logout()}>
              Logout
            </Button>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4">
          <Outlet />
        </main>
      </section>
    </div>
  );
}

function SidebarLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block rounded-md px-3 py-2 text-sm font-semibold ${isActive ? "bg-app-primary text-white" : "text-app-text hover:bg-app-muted"}`
      }
    >
      {label}
    </NavLink>
  );
}
