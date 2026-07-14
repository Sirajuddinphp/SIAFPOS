CREATE TABLE terminals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  restaurant_uuid TEXT NOT NULL,
  outlet_uuid TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  device_identifier TEXT NOT NULL,
  app_version TEXT NOT NULL,
  last_active_at TEXT,
  registration_status TEXT NOT NULL DEFAULT 'registered' CHECK (registration_status IN ('registered', 'pending', 'disabled')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (restaurant_uuid) REFERENCES restaurants (uuid),
  FOREIGN KEY (outlet_uuid) REFERENCES outlets (uuid)
);

CREATE UNIQUE INDEX idx_terminals_outlet_code ON terminals (outlet_uuid, code);
CREATE INDEX idx_terminals_registration_status ON terminals (registration_status);
