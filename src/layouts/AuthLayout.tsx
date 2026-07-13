import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <main className="flex h-screen w-screen items-center justify-center bg-app-bg px-6">
      <Outlet />
    </main>
  );
}
