# Phase 6: Customers, Reports and Settings

Implemented modules:

- Customer search, create, edit, activate and deactivate
- Offline SQLite persistence through repository/service/IPC layers
- Sales summary by date range
- Daily sales and top-item reports
- Payment-mode totals
- Restaurant operational settings for GST mode, round-off, invoice prefix and language
- Active sidebar routes for Customers, Reports and Settings

Reports read settled local bills and payments, so they work offline. Settings remain terminal-local in `app_settings` until cloud master-data sync is expanded.
