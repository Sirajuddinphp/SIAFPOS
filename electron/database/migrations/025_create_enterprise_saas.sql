CREATE TABLE enterprise_license (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  license_key_hash TEXT NOT NULL,
  license_key_prefix TEXT NOT NULL,
  plan_code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('trial','active','expired','suspended','revoked')),
  max_outlets INTEGER NOT NULL DEFAULT 1,
  max_terminals INTEGER NOT NULL DEFAULT 1,
  activated_at TEXT,
  expires_at TEXT,
  last_verified_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE enterprise_devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  terminal_uuid TEXT,
  device_name TEXT NOT NULL,
  device_fingerprint TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL,
  app_version TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','blocked')),
  last_seen_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (terminal_uuid) REFERENCES terminals(uuid)
);

CREATE TABLE enterprise_api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  scopes_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  last_used_at TEXT,
  expires_at TEXT,
  created_by_user_uuid TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY (created_by_user_uuid) REFERENCES users(uuid)
);

CREATE TABLE enterprise_backups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  checksum_sha256 TEXT,
  status TEXT NOT NULL CHECK (status IN ('creating','ready','failed','restore_requested','restored')),
  created_by_user_uuid TEXT NOT NULL,
  error_message TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (created_by_user_uuid) REFERENCES users(uuid)
);

CREATE TABLE enterprise_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_uuid TEXT,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_uuid TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (created_by_user_uuid) REFERENCES users(uuid)
);

CREATE INDEX idx_enterprise_devices_status ON enterprise_devices(status, last_seen_at);
CREATE INDEX idx_enterprise_api_keys_status ON enterprise_api_keys(status, created_at);
CREATE INDEX idx_enterprise_backups_status ON enterprise_backups(status, created_at);
CREATE INDEX idx_enterprise_events_created ON enterprise_events(created_at DESC);
