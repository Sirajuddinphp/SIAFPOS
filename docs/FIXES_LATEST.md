# Latest stability fixes

- Restored complete KotService with preview/create/get/list/cancel/status/reprint methods.
- Restored KDS setPriority, setStation and listActive methods.
- Made migration path resolution safe when Electron app is unavailable in Vitest.
- Restored migration-runner test and expected 25 migrations.
- Kept CustomerService.save compatibility used by CRM tests.
- Preserved settled-bill filtering in running orders.
- Validated migrations 001-025 on a clean SQLite database.
