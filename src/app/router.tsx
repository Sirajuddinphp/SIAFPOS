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
import { useAuthStore } from "../stores/auth-store";

function ProtectedRoute() {
  const session = useAuthStore((state) => state.session);
  return session ? <Outlet /> : <Navigate to="/login" replace />;
}

export const router = createHashRouter([
  {
    path: "/",
    element: <StartupScreen />
  },
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
          }
        ]
      }
    ]
  }
]);
