import { createHashRouter, Navigate, Outlet } from "react-router-dom";
import { AuthLayout } from "../layouts/AuthLayout";
import { AppLayout } from "../layouts/AppLayout";
import { LoginScreen } from "../features/auth/LoginScreen";
import { StartupScreen } from "../features/system-status/StartupScreen";
import { DashboardScreen } from "../features/dashboard/DashboardScreen";
import { PosScreen } from "../features/pos/PosScreen";
import { TablesScreen } from "../features/tables/TablesScreen";
import { HeldOrdersScreen } from "../features/orders/HeldOrdersScreen";
import { RunningOrdersScreen } from "../features/orders/RunningOrdersScreen";
import { KitchenScreen } from "../features/kitchen/KitchenScreen";
import { ShiftScreen } from "../features/shifts/ShiftScreen";
import { BillingScreen } from "../features/billing/BillingScreen";
import { PrinterScreen } from "../features/printers/PrinterScreen";
import { SyncScreen } from "../features/sync/SyncScreen";
import { CustomersScreen } from "../features/customers/CustomersScreen";
import { ReportsScreen } from "../features/reports/ReportsScreen";
import { SettingsScreen } from "../features/settings/SettingsScreen";
import { InventoryScreen } from "../features/inventory/InventoryScreen";
import { StaffScreen } from "../features/staff/StaffScreen";
import { MenuManagementScreen } from "../features/menu-management/MenuManagementScreen";
import { OutletsScreen } from "../features/outlets/OutletsScreen";
import { AccountingScreen } from "../features/accounting/AccountingScreen";
import { EnterpriseScreen } from "../features/enterprise/EnterpriseScreen";
import { ActivationScreen } from "../features/activation/ActivationScreen";
import { useActivationStore } from "../stores/activation-store";
import { useAuthStore } from "../stores/auth-store";

function ProtectedRoute() {
  const session = useAuthStore((state) => state.session);
  const activation = useActivationStore((state) => state.state);
  if (!activation?.activated) return <Navigate to="/activation" replace />;
  return session ? <Outlet /> : <Navigate to="/login" replace />;
}

export const router = createHashRouter([
  {
    path: "/",
    element: <StartupScreen />
  },
  { path: "/activation", element: <ActivationScreen /> },
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/login",
        element: <LoginScreen />
      }
    ]
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardScreen />
          },
          {
            path: "/pos",
            element: <PosScreen />
          },
          {
            path: "/tables",
            element: <TablesScreen />
          },
          {
            path: "/orders/held",
            element: <HeldOrdersScreen />
          },
          {
            path: "/orders/running",
            element: <RunningOrdersScreen />
          },
          {
            path: "/kitchen",
            element: <KitchenScreen />
          },
          {
            path: "/shift",
            element: <ShiftScreen />
          },
          {
            path: "/billing",
            element: <BillingScreen />
          },
          {
            path: "/printers",
            element: <PrinterScreen />
          },
          { path: "/sync", element: <SyncScreen /> },
          { path: "/customers", element: <CustomersScreen /> },
          { path: "/reports", element: <ReportsScreen /> },
          { path: "/settings", element: <SettingsScreen /> },
          { path: "/inventory", element: <InventoryScreen /> },
          { path: "/staff", element: <StaffScreen /> },
          { path: "/menu-management", element: <MenuManagementScreen /> },
          { path: "/outlets", element: <OutletsScreen /> },
          { path: "/accounting", element: <AccountingScreen /> },
          { path: "/enterprise", element: <EnterpriseScreen /> }
        ]
      }
    ]
  }
]);
