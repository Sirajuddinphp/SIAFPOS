# PHASE A1 — First Activation System

## Folder structure
`app/Http/Controllers/Api/V1`, `app/Http/Requests/Activation`, `app/Http/Resources`, `app/Services`, `app/Repositories`, `app/Models`, `database/migrations`, `tests/Feature`, `tests/Unit`, `postman`.

## Endpoint
`POST /api/v1/activation` (5 requests/minute per IP + restaurant code). It validates restaurant ownership, license status/date, subscription status/grace, terminal limit, device identity, then issues a device-scoped JWT and returns initial configuration.

## Security decisions
License key is stored only as SHA-256 hash plus last four characters. JWT contains tenant, restaurant, device and license UUID claims. Internal numeric IDs never appear in API responses. Activation is transactional and idempotent for the same device UUID. Failed attempts are audited. Device status `revoked` or `blocked` denies use.

## Production checklist
- Configure JWT secret and short access-token TTL.
- Configure Redis-backed rate limiter and queues.
- Force HTTPS/HSTS and trusted proxies.
- Add API exception envelope with stable error codes.
- Ensure all models use tenant global scopes or explicit tenant repositories.
- Run migrations, seed controlled test tenant, rotate demo credentials.
- Enable database backups, audit retention and centralized logs.
- Add device heartbeat/verification in A4; do not build sync yet.

## Verification checklist
- Fresh install opens activation only.
- Manual URL to login/POS redirects to activation.
- Protected IPC handlers are not registered before activation.
- Invalid restaurant/license/subscription cannot create device.
- Terminal limit enforced under concurrent requests.
- Successful activation stores encrypted JWT and UUIDs locally.
- Restart opens login/dashboard path only when activation exists.
- Cloud timeout keeps POS locked.

## Phase complete
Code complete: Yes. Runtime sign-off: No, until installed inside a real Laravel 12 application with JWT package, Redis/MySQL and the full automated suite passing.
