CREATE TABLE app_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_type TEXT NOT NULL CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
  is_secure INTEGER NOT NULL DEFAULT 0 CHECK (is_secure IN (0, 1)),
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_app_settings_key ON app_settings (setting_key);
