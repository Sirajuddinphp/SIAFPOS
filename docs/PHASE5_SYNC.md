# Phase 5 Offline Cloud Sync Foundation

Implemented in this build:

- Durable SQLite `sync_outbox` and `sync_state` tables.
- Automatic outbox events for orders, order items, KOT tickets, payments, and shifts.
- Retry/backoff states: pending, syncing, synced, failed, conflict.
- Secure main-process sync service and typed IPC/preload bridge.
- Cloud Sync screen for Laravel API URL/token configuration, manual sync, and retry.
- Push contract: `POST {apiUrl}/api/pos/sync/push` with idempotent event UUIDs.

The Laravel endpoint itself is not part of the Electron repository and must accept the documented event payload before real cloud delivery can succeed.
