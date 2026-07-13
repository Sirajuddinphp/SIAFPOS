# Laravel API Documentation

Status: Architecture baseline  
Backend: Laravel REST API  
Cloud database: MySQL  
Primary clients: Electron desktop terminals, admin web portal, reporting workers

## 1. API Standards

Base path:

```text
/api/v1
```

Transport:

- HTTPS only in production.
- JSON request/response bodies.
- UTF-8 encoding.
- Amounts are integer minor units.
- Timestamps are ISO 8601 UTC.
- UUIDs are string identifiers for syncable entities.

Standard success envelope:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "request_id": "req_...",
    "server_time": "2026-07-11T10:00:00Z"
  }
}
```

Standard error envelope:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Validation failed.",
    "details": {}
  },
  "meta": {
    "request_id": "req_...",
    "server_time": "2026-07-11T10:00:00Z"
  }
}
```

## 2. Authentication and Authorization

Authentication model:

- Terminal registration creates a terminal credential.
- Staff login creates a staff session token.
- Sync endpoints require terminal token.
- Manager/admin endpoints require staff token with permissions.

Headers:

| Header | Required | Purpose |
|---|---|---|
| `Authorization: Bearer <token>` | yes | terminal or staff token |
| `X-Store-Id` | yes | store UUID |
| `X-Terminal-Id` | for desktop | terminal UUID |
| `X-Request-Id` | recommended | idempotent tracing |
| `Idempotency-Key` | for mutations | prevents duplicate writes |

Common HTTP codes:

| Code | Meaning |
|---:|---|
| 200 | success |
| 201 | created |
| 202 | accepted for async processing |
| 400 | invalid request |
| 401 | unauthenticated |
| 403 | unauthorized |
| 404 | not found |
| 409 | conflict or duplicate mutation |
| 422 | validation failed |
| 429 | rate limited |
| 500 | server error |

## 3. Endpoint Groups

### 3.1 Auth

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/auth/terminal/register` | register a desktop terminal using pairing token | none/pairing token |
| POST | `/auth/terminal/refresh` | refresh terminal token | terminal |
| POST | `/auth/login` | staff login by PIN/password | terminal |
| POST | `/auth/logout` | end staff session | staff |
| GET | `/auth/me` | get active staff profile, roles, permissions | staff |
| POST | `/auth/manager-approval` | validate manager approval for protected action | staff |

Terminal registration body:

```json
{
  "store_code": "MH5-AHD",
  "terminal_name": "Counter 1",
  "device_fingerprint": "hash",
  "pairing_token": "secret"
}
```

### 3.2 Stores and Terminals

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/stores/current` | current store profile | terminal/staff |
| PATCH | `/stores/current` | update store profile | admin |
| GET | `/branches` | list branches | staff |
| GET | `/terminals` | list store terminals | manager |
| GET | `/terminals/{uuid}` | terminal detail | manager |
| PATCH | `/terminals/{uuid}` | update terminal status/settings | admin |
| POST | `/terminals/{uuid}/revoke` | revoke terminal access | admin |
| POST | `/terminals/{uuid}/heartbeat` | terminal health heartbeat | terminal |

### 3.3 Users, Roles, and Permissions

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/users` | list staff | manager |
| POST | `/users` | create staff | admin |
| GET | `/users/{uuid}` | staff detail | manager |
| PATCH | `/users/{uuid}` | update staff | admin |
| POST | `/users/{uuid}/disable` | disable staff | admin |
| POST | `/users/{uuid}/pin` | set/reset staff PIN | admin |
| GET | `/roles` | list roles | manager |
| POST | `/roles` | create custom role | admin |
| PATCH | `/roles/{uuid}` | update role | admin |
| GET | `/permissions` | list permissions | manager |

### 3.4 Catalog

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/catalog/bootstrap` | complete catalog snapshot for terminal bootstrap | terminal |
| GET | `/catalog/categories` | list categories | staff |
| POST | `/catalog/categories` | create category | manager |
| PATCH | `/catalog/categories/{uuid}` | update category | manager |
| DELETE | `/catalog/categories/{uuid}` | archive category | manager |
| GET | `/catalog/items` | list menu items | staff |
| POST | `/catalog/items` | create menu item | manager |
| GET | `/catalog/items/{uuid}` | menu item detail | staff |
| PATCH | `/catalog/items/{uuid}` | update menu item | manager |
| DELETE | `/catalog/items/{uuid}` | archive menu item | manager |
| POST | `/catalog/items/{uuid}/prices` | add price version | manager |
| GET | `/catalog/modifier-groups` | list modifier groups | staff |
| POST | `/catalog/modifier-groups` | create modifier group | manager |
| PATCH | `/catalog/modifier-groups/{uuid}` | update modifier group | manager |
| GET | `/catalog/price-books` | list price books | manager |
| POST | `/catalog/import` | import catalog file | admin |

### 3.5 Tax, Charges, and Discounts

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/taxes` | list taxes and groups | staff |
| POST | `/taxes` | create tax | admin |
| PATCH | `/taxes/{uuid}` | update tax | admin |
| GET | `/charges` | list charges | staff |
| POST | `/charges` | create charge | manager |
| PATCH | `/charges/{uuid}` | update charge | manager |
| GET | `/discounts` | list discounts | staff |
| POST | `/discounts` | create discount | manager |
| PATCH | `/discounts/{uuid}` | update discount | manager |

### 3.6 Tables and Reservations

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/tables/floors` | list floor areas and tables | staff |
| POST | `/tables/floors` | create floor area | manager |
| PATCH | `/tables/floors/{uuid}` | update floor area | manager |
| POST | `/tables` | create table | manager |
| PATCH | `/tables/{uuid}` | update table | manager |
| GET | `/tables/status` | cloud table status snapshot | staff |
| POST | `/reservations` | create reservation | staff |
| GET | `/reservations` | list reservations | staff |
| PATCH | `/reservations/{uuid}` | update reservation | staff |
| POST | `/waitlist` | add waitlist entry | staff |
| PATCH | `/waitlist/{uuid}` | update waitlist entry | staff |

### 3.7 Orders

Direct order endpoints are primarily for cloud visibility and admin workflows. Desktop operational order writes should normally go through `/sync/push`.

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/orders` | list synced orders | staff |
| GET | `/orders/{uuid}` | order detail | staff |
| POST | `/orders/{uuid}/void` | cloud-side void with approval | manager |
| GET | `/orders/{uuid}/history` | order status history | staff |
| GET | `/orders/active` | active cloud order snapshot | staff |
| GET | `/orders/held` | held cloud order snapshot | staff |

### 3.8 Billing and Payments

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/bills` | list bills | staff |
| GET | `/bills/{uuid}` | bill detail | staff |
| GET | `/bills/{uuid}/payments` | bill payments | staff |
| POST | `/bills/{uuid}/refunds` | create refund with approval | manager |
| GET | `/payments` | list payments | manager |
| GET | `/refunds` | list refunds | manager |
| GET | `/payment-methods` | list payment methods | staff |
| POST | `/payment-methods` | create custom payment method | admin |
| PATCH | `/payment-methods/{uuid}` | update payment method | admin |

### 3.9 Shifts and Cash

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/shifts` | list shifts | manager |
| GET | `/shifts/{uuid}` | shift detail | manager |
| GET | `/shifts/{uuid}/cash-movements` | shift cash movement list | manager |
| GET | `/day-closes` | list day closes | manager |
| POST | `/day-closes/{uuid}/approve` | approve day close | owner/admin |

### 3.10 Delivery and Channels

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/delivery/orders` | list delivery orders | staff |
| GET | `/delivery/zones` | list delivery zones | staff |
| POST | `/delivery/zones` | create delivery zone | manager |
| PATCH | `/delivery/zones/{uuid}` | update delivery zone | manager |
| GET | `/delivery/riders` | list riders | staff |
| POST | `/delivery/riders` | create rider | manager |
| PATCH | `/delivery/riders/{uuid}` | update rider | manager |
| GET | `/channels` | list third-party channels | admin |
| POST | `/channels/{uuid}/orders/import` | import external order | admin/integration |

### 3.11 Printing and Devices

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/devices` | list devices | manager |
| POST | `/devices` | register device metadata | manager |
| PATCH | `/devices/{uuid}` | update device | manager |
| GET | `/printers` | list cloud printer config | manager |
| POST | `/printers` | create printer config | manager |
| PATCH | `/printers/{uuid}` | update printer config | manager |
| GET | `/print-templates` | list print templates | manager |
| POST | `/print-templates` | create template | admin |
| PATCH | `/print-templates/{uuid}` | update template | admin |

### 3.12 Sync

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/sync/bootstrap` | initial terminal snapshot | terminal |
| POST | `/sync/push` | push local outbox events | terminal |
| POST | `/sync/pull` | pull cloud changes after cursor | terminal |
| POST | `/sync/ack` | acknowledge applied inbound records | terminal |
| GET | `/sync/status` | get cloud sync state | terminal |
| POST | `/sync/conflicts` | upload local conflict logs | terminal |
| GET | `/sync/conflicts` | list conflicts for review | manager |
| POST | `/sync/conflicts/{uuid}/resolve` | resolve conflict | manager |

Push body:

```json
{
  "terminal_uuid": "terminal-uuid",
  "batch_uuid": "batch-uuid",
  "events": [
    {
      "event_uuid": "event-uuid",
      "aggregate_type": "order",
      "aggregate_uuid": "order-uuid",
      "event_type": "order.created",
      "version": 1,
      "occurred_at": "2026-07-11T10:00:00Z",
      "payload": {}
    }
  ]
}
```

Push response:

```json
{
  "success": true,
  "data": {
    "accepted": ["event-uuid"],
    "duplicates": [],
    "rejected": []
  }
}
```

Pull body:

```json
{
  "terminal_uuid": "terminal-uuid",
  "cursors": {
    "catalog": "cursor-1",
    "settings": "cursor-2",
    "orders": "cursor-3"
  },
  "limit": 500
}
```

Pull response:

```json
{
  "success": true,
  "data": {
    "changes": [],
    "next_cursors": {
      "catalog": "cursor-4"
    },
    "has_more": false
  }
}
```

### 3.13 Reports

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/reports/sales` | sales report | manager |
| GET | `/reports/items` | item sales report | manager |
| GET | `/reports/taxes` | tax report | manager |
| GET | `/reports/payments` | payment report | manager |
| GET | `/reports/shifts` | shift report | manager |
| GET | `/reports/staff` | staff performance report | manager |
| GET | `/reports/refunds` | refund/void report | manager |
| POST | `/reports/exports` | create export | manager |
| GET | `/reports/exports/{uuid}` | export status/download metadata | manager |

Report query parameters:

| Parameter | Purpose |
|---|---|
| `from` | start datetime/date |
| `to` | end datetime/date |
| `business_date` | restaurant business date |
| `terminal_uuid` | filter by terminal |
| `user_uuid` | filter by staff |
| `payment_method_uuid` | filter by tender |
| `format` | `json`, `csv`, `pdf` for exports |

### 3.14 Admin, Health, and Backups

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/health` | API health check | none |
| GET | `/admin/audit-logs` | audit log search | admin |
| GET | `/admin/security-events` | security events | admin |
| POST | `/admin/backups` | request cloud backup | admin |
| GET | `/admin/backups` | list backups | admin |
| GET | `/admin/app-versions` | available desktop versions | terminal/staff |
| POST | `/admin/app-versions` | publish app version metadata | admin |

## 4. Sync Event Types

Desktop should emit these event names through `sync_outbox`.

| Event | Aggregate | Notes |
|---|---|---|
| `terminal.heartbeat` | terminal | periodic terminal health |
| `shift.opened` | cash_shift | shift start |
| `shift.closed` | cash_shift | shift close summary |
| `order.created` | order | new order |
| `order.updated` | order | cart/order changes |
| `order.held` | order | order parked |
| `order.resumed` | order | held order resumed |
| `order.voided` | order | void with reason/approval |
| `kot.created` | kot_ticket | KOT saved |
| `kot.cancelled` | kot_ticket | KOT cancellation |
| `bill.created` | bill | bill generated |
| `bill.settled` | bill | bill paid/closed |
| `payment.created` | payment | payment captured |
| `refund.created` | refund | refund recorded |
| `cash.movement_created` | cash_movement | cash in/out |
| `print.job_created` | print_job | print intent |
| `print.job_completed` | print_job | print success |
| `print.job_failed` | print_job | print failure |
| `audit.created` | audit_log | high-risk actions |

## 5. Validation Rules

- `uuid` must be valid and unique within its resource.
- `store_id` must match authenticated token scope.
- Amounts must be integers greater than or equal to zero unless the field is an adjustment.
- Settled bills cannot be modified by update endpoints.
- Refund amount cannot exceed paid amount minus previous refunds.
- Void/refund/reprint manager approval must include `approval_uuid`.
- Sync event UUIDs must be idempotent.

## 6. Security Rules

- All protected endpoints use authorization policies.
- Terminal tokens can be revoked.
- Staff tokens expire and refresh based on security policy.
- Admin endpoints require explicit permissions.
- Sensitive values are not returned after creation.
- API logs request IDs, actor UUID, terminal UUID, and store UUID.

## 7. API Acceptance Criteria

- Terminal can bootstrap catalog, users, taxes, tables, printers, and settings.
- Desktop can push duplicate sync events safely without duplicate cloud records.
- Pull sync returns cursor-based incremental changes.
- Reports can be filtered by date, terminal, staff, and payment method.
- Unauthorized staff cannot call manager/admin endpoints.
- Refund and void APIs preserve immutable original bill/payment records.
