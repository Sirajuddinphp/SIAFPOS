# Phase 10–11: CRM, Loyalty, QR and Online Ordering

Adds offline customer points/wallet balances, coupons, memberships, online sales channels, table QR tokens and an online order intake/status queue. All operations persist to SQLite and use typed IPC through the Electron preload bridge.

QR tokens currently expose a local placeholder ordering URL. A hosted customer menu/API can consume the token in a later cloud deployment phase.
