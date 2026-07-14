# MealHi5 POS Desktop

MealHi5 POS is a Windows-first offline Restaurant POS desktop foundation built with Electron, React, TypeScript, Vite, Tailwind CSS, Zustand, SQLite, and secure typed IPC.

This repository currently implements Phase 1 only:

- secure Electron shell
- React renderer inside Electron
- SQLite database in Electron `userData`
- numbered migrations
- development seed data
- local offline authentication
- protected routes
- system/database/connectivity status
- typed preload bridge and allow-listed IPC
- Windows installer configuration
- foundation tests

POS billing, menu, KOT, printing, tables, and payments are intentionally not implemented in Phase 1.

## Stack

- Electron
- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- React Router
- SQLite with `better-sqlite3`
- Zod
- electron-log
- electron-store
- electron-builder
- Vitest

## Development

Install dependencies:

```bash
npm install
```

Start Electron with the Vite renderer:

```bash
npm run dev
```

Run type checks:

```bash
npm run typecheck
```

Run tests:

```bash
npm test
```

Build the renderer and Electron main/preload code:

```bash
npm run build
```

Build the Windows installer:

```bash
npm run build:win
```

## Demo Login

Development seed data is created only when the database is empty and the app is not packaged.

- Restaurant code: `MH5-DEMO`
- Outlet code: `MAIN`
- Terminal code: `POS-01`
- Username: `admin`
- Password: `admin123`
- PIN: `1234`

Passwords and PINs are stored as secure hashes, never as plain text.

## SQLite Location

The production database is stored inside Electron's `userData` directory as:

```text
mealhi5-pos.sqlite
```

It is never stored inside the application installation folder.

## Manual Verification Checklist

1. Install dependencies with `npm install`.
2. Start development mode with `npm run dev`.
3. Confirm the Electron window opens.
4. Confirm the SQLite database is created in Electron `userData`.
5. Confirm migrations run.
6. Login using `admin` / `admin123`.
7. Login using PIN `1234`.
8. Confirm the dashboard loads.
9. Restart the app.
10. Confirm terminal configuration remains available.
11. Logout.
12. Run `npm run typecheck`.
13. Run `npm test`.
14. Build Windows installer with `npm run build:win`.

## Security Baseline

- `contextIsolation: true`
- `nodeIntegration: false`
- `enableRemoteModule: false`
- `webSecurity: true`
- `sandbox: true`
- strict Content Security Policy
- typed preload bridge
- no raw `ipcRenderer` exposure
- no direct SQLite access from React
- Zod validation on IPC inputs
- sanitized auth sessions only

## Phase 3: Billing and shifts

Phase 3 adds local cashier shifts, bill settlement, Cash/UPI/Card/split payments, cash change calculation, immutable payment records, and persisted receipt print jobs. Open a shift from **Shift**, then open a running order and choose **Bill**.

Hardware ESC/POS dispatch is intentionally deferred; **Queue Receipt** creates an auditable pending print job for the printer service phase.

## Phase 4 printer integration

The desktop now includes printer profiles, mock/LAN ESC/POS transports, USB/shared-device path output, 58mm/80mm templates, receipt/KOT queues, retry, diagnostics, test printing, and cash-drawer commands.

For development, create a `mock` printer from the Printers screen. LAN thermal printers normally use port `9100`. USB printers must be exposed through a writable operating-system device/shared-printer path. Printing failures remain in the durable queue and do not roll back billing or KOT operations.


## Current implementation status

- Phase 1: Electron/React/SQLite foundation
- Phase 2: POS Core and Delta KOT
- Phase 3: Billing, payments, and shifts
- Phase 4: Printer profiles, ESC/POS queue, diagnostics, and routing
- Phase 5 foundation: Offline sync outbox and Laravel push client

Electron uses `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: false` because the preload bridge imports compiled local modules.
