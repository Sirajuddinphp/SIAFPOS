CREATE TABLE outlets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  restaurant_uuid TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (restaurant_uuid) REFERENCES restaurants (uuid)
);

CREATE UNIQUE INDEX idx_outlets_restaurant_code ON outlets (restaurant_uuid, code);
CREATE INDEX idx_outlets_status ON outlets (status);
