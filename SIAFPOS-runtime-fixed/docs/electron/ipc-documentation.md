# Electron IPC Documentation

Status: Architecture baseline  
Desktop runtime: Electron main + preload + React renderer  
IPC style: typed command/query/event channels  
Security rule: renderer never accesses Node, SQLite, printers, filesystem, or credentials directly

## 1. IPC Principles

- Renderer calls only APIs exposed by preload.
- Preload exposes a narrow allow-listed API.
- Main process validates every payload.
- Main process owns SQLite, sync, printing, files, app updates, and device access.
- All business mutations run through services and repositories.
- All privileged operations require active staff session and permission checks.

## 2. Standard IPC Result

Every request/response channel returns this shape:

```ts
type IpcResult<T> =
  | { success: true; data: T; requestId: string }
  | { success: false; error: { code: string; message: string; details?: unknown }; requestId: string };
```

Common error codes:

| Code | Meaning |
|---|---|
| `VALIDATION_FAILED` | payload validation failed |
| `UNAUTHENTICATED` | no active staff session |
| `FORBIDDEN` | missing permission |
| `NOT_FOUND` | record not found |
| `CONFLICT` | version/state conflict |
| `DB_ERROR` | SQLite operation failed |
| `PRINTER_OFFLINE` | printer unavailable |
| `SYNC_UNAVAILABLE` | cloud/sync unavailable |
| `DEVICE_ERROR` | device operation failed |
| `UNKNOWN_ERROR` | unexpected failure |

## 3. Preload API Namespaces

Expose the following namespaces on `window.pos`:

```text
window.pos.auth
window.pos.terminal
window.pos.catalog
window.pos.tables
window.pos.orders
window.pos.kot
window.pos.billing
window.pos.payments
window.pos.shifts
window.pos.customers
window.pos.delivery
window.pos.inventory
window.pos.printing
window.pos.sync
window.pos.reports
window.pos.settings
window.pos.devices
window.pos.system
```

## 4. Channel Catalog

### 4.1 Auth Channels

| Channel | Type | Permission | Purpose |
|---|---|---|---|
| `auth:get-session` | query | none | get current local staff session |
| `auth:login-pin` | command | none | authenticate staff by PIN |
| `auth:login-password` | command | none | authenticate staff by password |
| `auth:logout` | command | authenticated | close staff session |
| `auth:lock-screen` | command | authenticated | lock terminal UI |
| `auth:unlock-screen` | command | none | unlock using staff PIN |
| `auth:manager-approval` | command | manager/admin | approve protected action |
| `auth:get-permissions` | query | authenticated | get current staff permissions |
| `auth:change-pin` | command | authenticated | change own PIN |
| `auth:reset-staff-pin` | command | admin | reset staff PIN |

Payload notes:

- Login channels return staff profile, roles, permissions, and landing screen.
- Manager approval returns `approval_uuid` for audit and mutation payloads.

### 4.2 Terminal Channels

| Channel | Type | Permission | Purpose |
|---|---|---|---|
| `terminal:get-profile` | query | none | read terminal/store profile |
| `terminal:register` | command | none/admin | pair terminal with cloud |
| `terminal:update-profile` | command | admin | update local terminal metadata |
| `terminal:get-health` | query | none | startup health status |
| `terminal:heartbeat` | command | none | write heartbeat and queue sync event |
| `terminal:get-business-day` | query | authenticated | get active business day |
| `terminal:open-business-day` | command | manager | open business day |
| `terminal:close-business-day` | command | manager | close business day |

### 4.3 Catalog Channels

| Channel | Type | Permission | Purpose |
|---|---|---|---|
| `catalog:get-bootstrap` | query | authenticated | load categories, items, prices, taxes, modifiers |
| `catalog:list-categories` | query | authenticated | list menu categories |
| `catalog:create-category` | command | menu.manage | create category |
| `catalog:update-category` | command | menu.manage | update category |
| `catalog:archive-category` | command | menu.manage | soft delete category |
| `catalog:list-items` | query | authenticated | list menu items |
| `catalog:get-item` | query | authenticated | menu item detail |
| `catalog:create-item` | command | menu.manage | create item |
| `catalog:update-item` | command | menu.manage | update item |
| `catalog:archive-item` | command | menu.manage | soft delete item |
| `catalog:set-item-price` | command | menu.manage | add price version |
| `catalog:list-modifier-groups` | query | authenticated | list modifier groups |
| `catalog:create-modifier-group` | command | menu.manage | create modifier group |
| `catalog:update-modifier-group` | command | menu.manage | update modifier group |
| `catalog:list-price-books` | query | authenticated | list price books |
| `catalog:search-items` | query | authenticated | search active menu items |

### 4.4 Tax, Discount, and Charge Channels

| Channel | Type | Permission | Purpose |
|---|---|---|---|
| `settings:list-taxes` | query | authenticated | list taxes and tax groups |
| `settings:create-tax` | command | settings.tax.manage | create tax |
| `settings:update-tax` | command | settings.tax.manage | update tax |
| `settings:list-discounts` | query | authenticated | list discounts |
| `settings:create-discount` | command | settings.discount.manage | create discount |
| `settings:update-discount` | command | settings.discount.manage | update discount |
| `settings:list-charges` | query | authenticated | list charges |
| `settings:create-charge` | command | settings.charge.manage | create charge |
| `settings:update-charge` | command | settings.charge.manage | update charge |

### 4.5 Table and Floor Channels

| Channel | Type | Permission | Purpose |
|---|---|---|---|
| `tables:get-floor-map` | query | authenticated | load floor areas and table statuses |
| `tables:list-areas` | query | authenticated | list floor areas |
| `tables:create-area` | command | tables.manage | create area |
| `tables:update-area` | command | tables.manage | update area |
| `tables:create-table` | command | tables.manage | create table |
| `tables:update-table` | command | tables.manage | update table |
| `tables:open-session` | command | order.create | open table session |
| `tables:close-session` | command | order.close | close table session |
| `tables:transfer` | command | order.transfer | transfer order/table |
| `tables:merge` | command | order.merge | merge tables |
| `tables:mark-clean` | command | tables.manage | mark dirty table clean |

### 4.6 Customer and Delivery Channels

| Channel | Type | Permission | Purpose |
|---|---|---|---|
| `customers:search` | query | authenticated | search customers by phone/name |
| `customers:get` | query | authenticated | get customer profile |
| `customers:create` | command | customer.manage | create customer |
| `customers:update` | command | customer.manage | update customer |
| `customers:add-address` | command | customer.manage | add delivery address |
| `delivery:list-orders` | query | authenticated | list delivery orders |
| `delivery:update-status` | command | delivery.manage | update delivery state |
| `delivery:assign-rider` | command | delivery.manage | assign rider |
| `delivery:list-riders` | query | authenticated | list riders |
| `delivery:create-rider` | command | delivery.manage | create rider |
| `delivery:list-zones` | query | authenticated | list delivery zones |

### 4.7 Order Channels

| Channel | Type | Permission | Purpose |
|---|---|---|---|
| `orders:create` | command | order.create | create new order |
| `orders:get` | query | authenticated | get order with lines |
| `orders:list-active` | query | authenticated | list active orders |
| `orders:list-held` | query | authenticated | list held orders |
| `orders:list-closed` | query | order.view.closed | list closed orders |
| `orders:add-item` | command | order.edit | add item to order |
| `orders:update-item` | command | order.edit | change qty/modifiers/notes |
| `orders:void-item` | command | order.void | void order item with approval when required |
| `orders:apply-discount` | command | order.discount | apply order discount |
| `orders:apply-charge` | command | order.charge | apply order charge |
| `orders:hold` | command | order.hold | park order |
| `orders:resume` | command | order.edit | resume held order |
| `orders:transfer` | command | order.transfer | transfer order mode/table |
| `orders:split` | command | order.split | create split draft |
| `orders:merge` | command | order.merge | merge compatible orders |
| `orders:void` | command | order.void | void entire order |
| `orders:recalculate` | query | authenticated | calculate totals without mutation |

Rules:

- Mutating order channels must create `sync_outbox` records.
- Item snapshots must include name, price, tax, and modifier values.

### 4.8 KOT Channels

| Channel | Type | Permission | Purpose |
|---|---|---|---|
| `kot:preview` | query | authenticated | preview station/printer routing |
| `kot:create` | command | kot.create | create KOT tickets and print jobs |
| `kot:get` | query | authenticated | KOT detail |
| `kot:list-by-order` | query | authenticated | list KOT tickets for order |
| `kot:cancel` | command | kot.cancel | cancel KOT with approval if needed |
| `kot:mark-started` | command | kitchen.manage | kitchen starts preparation |
| `kot:mark-ready` | command | kitchen.manage | kitchen marks ready |
| `kot:reprint` | command | print.reprint | create KOT reprint job |

### 4.9 Billing Channels

| Channel | Type | Permission | Purpose |
|---|---|---|---|
| `billing:preview` | query | authenticated | preview bill totals |
| `billing:create-bill` | command | bill.create | create bill from order/split |
| `billing:get-bill` | query | authenticated | bill detail |
| `billing:list-bills` | query | bill.view | list bills |
| `billing:split-bill` | command | bill.split | create split bills |
| `billing:apply-discount` | command | bill.discount | apply bill discount |
| `billing:remove-discount` | command | bill.discount | remove bill discount before settlement |
| `billing:void-bill` | command | bill.void | void bill before/with approval |
| `billing:reprint` | command | print.reprint | create receipt reprint job |

Rules:

- Once paid/closed, bill update channels must reject direct edits.
- Bill creation writes bill snapshots and sync event in one transaction.

### 4.10 Payment Channels

| Channel | Type | Permission | Purpose |
|---|---|---|---|
| `payments:list-methods` | query | authenticated | active payment methods |
| `payments:create` | command | payment.create | record payment |
| `payments:settle-bill` | command | payment.create | settle bill and create receipt print job |
| `payments:get` | query | authenticated | payment detail |
| `payments:list-by-bill` | query | authenticated | bill payment lines |
| `payments:void` | command | payment.void | void failed/incorrect payment with approval |
| `payments:create-refund` | command | refund.create | create refund |
| `payments:list-refunds` | query | refund.view | list refunds |

Rules:

- Settlement transaction writes bill status, payment, cash ledger, print job, audit log, and sync outbox.
- Refunds never delete original payments.

### 4.11 Shift and Cash Channels

| Channel | Type | Permission | Purpose |
|---|---|---|---|
| `shifts:get-current` | query | authenticated | current shift for terminal/user |
| `shifts:open` | command | shift.open | open cash shift |
| `shifts:close-preview` | query | shift.close | compute expected cash |
| `shifts:close` | command | shift.close | close shift |
| `shifts:list` | query | shift.view | list shifts |
| `shifts:get` | query | shift.view | shift detail |
| `cash:add-movement` | command | cash.manage | paid in/out |
| `cash:list-movements` | query | cash.view | list movements |
| `cash:open-drawer` | command | cash.drawer.open | trigger cash drawer |
| `cash:count-denominations` | command | shift.close | save denomination counts |

### 4.12 Printing Channels

| Channel | Type | Permission | Purpose |
|---|---|---|---|
| `printing:list-printers` | query | authenticated | configured printers |
| `printing:get-printer` | query | authenticated | printer detail |
| `printing:create-printer` | command | printer.manage | add printer |
| `printing:update-printer` | command | printer.manage | update printer |
| `printing:delete-printer` | command | printer.manage | archive printer |
| `printing:discover` | command | printer.manage | discover USB/LAN printers when supported |
| `printing:test` | command | printer.manage | test print |
| `printing:get-routes` | query | authenticated | printer routing rules |
| `printing:update-routes` | command | printer.manage | update routes |
| `printing:create-job` | command | print.create | create manual print job |
| `printing:list-jobs` | query | authenticated | print queue |
| `printing:retry-job` | command | print.retry | retry failed job |
| `printing:cancel-job` | command | print.cancel | cancel pending job |
| `printing:reprint-source` | command | print.reprint | reprint bill/KOT/shift |

Rules:

- Print job is always persisted before dispatch.
- Reprint requires permission and audit log.

### 4.13 Sync Channels

| Channel | Type | Permission | Purpose |
|---|---|---|---|
| `sync:get-status` | query | authenticated | sync status, queue count, last sync |
| `sync:get-queue` | query | sync.view | list outbox/inbox records |
| `sync:push-now` | command | sync.run | run push cycle |
| `sync:pull-now` | command | sync.run | run pull cycle |
| `sync:run-full-cycle` | command | sync.run | push then pull |
| `sync:retry-failed` | command | sync.run | retry failed outbox records |
| `sync:pause` | command | sync.manage | pause worker |
| `sync:resume` | command | sync.manage | resume worker |
| `sync:list-conflicts` | query | sync.view | list conflicts |
| `sync:resolve-conflict` | command | sync.manage | resolve conflict |
| `sync:bootstrap-cloud` | command | sync.manage | initial cloud bootstrap |

### 4.14 Reports Channels

| Channel | Type | Permission | Purpose |
|---|---|---|---|
| `reports:sales-summary` | query | reports.view | sales KPIs |
| `reports:sales-detail` | query | reports.view | sales rows |
| `reports:item-sales` | query | reports.view | item report |
| `reports:taxes` | query | reports.view | tax report |
| `reports:payments` | query | reports.view | payment report |
| `reports:shifts` | query | reports.view | shift report |
| `reports:staff` | query | reports.view | staff report |
| `reports:voids-refunds` | query | reports.view | void/refund report |
| `reports:export` | command | reports.export | export CSV/PDF |
| `reports:print` | command | reports.print | print report |

### 4.15 Inventory Channels

| Channel | Type | Permission | Purpose |
|---|---|---|---|
| `inventory:list-items` | query | inventory.view | list stock items |
| `inventory:create-item` | command | inventory.manage | create stock item |
| `inventory:update-item` | command | inventory.manage | update stock item |
| `inventory:list-movements` | query | inventory.view | stock ledger |
| `inventory:adjust-stock` | command | inventory.adjust | stock adjustment |
| `inventory:record-wastage` | command | inventory.adjust | wastage entry |
| `inventory:list-recipes` | query | inventory.view | recipe list |
| `inventory:update-recipe` | command | inventory.manage | update recipe |

### 4.16 Settings Channels

| Channel | Type | Permission | Purpose |
|---|---|---|---|
| `settings:get-all` | query | authenticated | load settings |
| `settings:get` | query | authenticated | get setting by key |
| `settings:set` | command | settings.manage | update setting |
| `settings:set-sensitive` | command | settings.manage | update encrypted secret |
| `settings:reset-local` | command | admin | reset terminal-local settings |
| `settings:export` | command | settings.export | export settings |
| `settings:import` | command | settings.import | import settings |

### 4.17 Device and System Channels

| Channel | Type | Permission | Purpose |
|---|---|---|---|
| `devices:list` | query | authenticated | list registered devices |
| `devices:create` | command | device.manage | create device |
| `devices:update` | command | device.manage | update device |
| `devices:test` | command | device.manage | test device |
| `system:get-version` | query | none | app/build versions |
| `system:get-paths` | query | admin | app data paths |
| `system:check-db` | command | admin | database integrity check |
| `system:create-backup` | command | admin | create local backup |
| `system:restore-backup` | command | admin | restore backup with safeguards |
| `system:get-logs` | query | admin | read app error logs |
| `system:check-updates` | command | admin | check app update metadata |
| `system:install-update` | command | admin | install downloaded update |

## 5. Renderer Event Subscriptions

Main process may emit these events to renderer through preload subscription methods.

| Event Channel | Payload | Purpose |
|---|---|---|
| `event:auth-session-changed` | session summary | login/logout/lock state changed |
| `event:terminal-health-changed` | health summary | DB/printer/sync health update |
| `event:order-updated` | order UUID/status | active order changed |
| `event:table-status-changed` | table UUID/status | floor map refresh |
| `event:kot-updated` | KOT UUID/status | kitchen ticket update |
| `event:bill-updated` | bill UUID/status | bill settled/voided |
| `event:payment-updated` | payment UUID/status | payment/refund update |
| `event:shift-updated` | shift UUID/status | shift opened/closed |
| `event:print-job-updated` | job UUID/status/error | print queue update |
| `event:printer-status-changed` | printer UUID/status | printer online/offline |
| `event:sync-status-changed` | status/counts | sync state update |
| `event:sync-conflict-created` | conflict UUID | conflict requires review |
| `event:settings-changed` | changed keys | settings refresh needed |
| `event:update-available` | version info | app update available |

Subscription rules:

- Preload returns unsubscribe functions.
- Renderer must not receive raw database rows with sensitive secrets.
- Events should carry identifiers and summaries; screens can query full read models.

## 6. IPC to Service Mapping

| Namespace | Main Process Service |
|---|---|
| `auth:*` | `AuthService` |
| `terminal:*` | `TerminalService` |
| `catalog:*` | `CatalogService` |
| `settings:*` | `SettingsService`, `TaxService`, `DiscountService` |
| `tables:*` | `TableService` |
| `customers:*` | `CustomerService` |
| `delivery:*` | `DeliveryService` |
| `orders:*` | `OrderService` |
| `kot:*` | `KotService` |
| `billing:*` | `BillingService` |
| `payments:*` | `PaymentService` |
| `shifts:*`, `cash:*` | `ShiftService`, `CashService` |
| `printing:*` | `PrintService` |
| `sync:*` | `SyncService` |
| `reports:*` | `ReportService` |
| `inventory:*` | `InventoryService` |
| `devices:*` | `DeviceService` |
| `system:*` | `SystemService` |

## 7. Transaction Rules by Channel

These channels must always execute inside SQLite transactions:

- `orders:create`
- `orders:add-item`
- `orders:update-item`
- `orders:void-item`
- `orders:void`
- `kot:create`
- `kot:cancel`
- `billing:create-bill`
- `billing:split-bill`
- `billing:void-bill`
- `payments:create`
- `payments:settle-bill`
- `payments:create-refund`
- `shifts:open`
- `shifts:close`
- `cash:add-movement`
- `printing:create-job`
- `printing:retry-job`
- `sync:push-now`
- `sync:pull-now`
- `sync:run-full-cycle`

Transaction side effects:

- Business mutation.
- Audit log when required.
- Sync outbox event when syncable.
- Print job when printable.
- Event notification to renderer after commit.

## 8. Security Rules

- IPC channel names must be hardcoded allow-list values.
- Payloads must be validated in main process.
- Renderer cannot pass SQL, file paths for arbitrary read/write, printer commands, or raw credentials.
- Sensitive commands require active session and permission check.
- Manager approval commands return approval UUID only, not manager credentials.
- All denied privileged attempts create audit/security events.

## 9. IPC Acceptance Criteria

- Renderer can complete full order-to-payment workflow using only documented IPC channels.
- No renderer code imports `better-sqlite3`, `fs`, `net`, printer libraries, or Electron main APIs.
- Printer failure is returned as structured error and also updates print job state.
- Sync can run in background and notify renderer without blocking POS screens.
- Every mutation channel has a clear permission, service owner, and sync/audit behavior.
