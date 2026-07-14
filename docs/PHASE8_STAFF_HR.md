# Phase 8 — Staff, HR & Security

Adds offline employee profiles linked to POS users, custom roles/permissions, attendance check-in/out, payroll draft generation, and audit-log viewing.

## Migration

`018_create_staff_hr_security.sql`

## UI

Open **Staff & HR** from the sidebar. Create employees first, then use Attendance and Payroll tabs. Existing audit logs are shown in the Audit tab.

## Security

Employee passwords and PINs are hashed with the existing scrypt helpers. Renderer access remains behind typed preload IPC and authenticated main-process handlers.
