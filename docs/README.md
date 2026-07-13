# MealHi5 POS Architecture Documentation

This folder contains the CTO-level implementation documentation for the greenfield Restaurant POS Desktop Software.

## Documents

- [UI/UX Design System and Screen Wireframes](ui-ux/ui-ux-design-system.md)
- [Complete Database Design](database/complete-database-design.md)
- [Laravel API Documentation](api/laravel-api-documentation.md)
- [Electron IPC Documentation](electron/ipc-documentation.md)

## Implementation Baseline

- Electron + React + TypeScript desktop app
- SQLite local database through `better-sqlite3`
- Zustand renderer state
- Tailwind CSS UI
- Secure Electron preload bridge and IPC
- Laravel REST API
- MySQL cloud database
- ESC/POS USB/LAN printing
- Offline-first sync using local outbox/inbox

## Current Scope

These files are architecture and specification documents only. They intentionally do not include application code.
