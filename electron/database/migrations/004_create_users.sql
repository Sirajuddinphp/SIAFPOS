CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  restaurant_uuid TEXT NOT NULL,
  outlet_uuid TEXT NOT NULL,
  name TEXT NOT NULL,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier', 'waiter', 'kitchen')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  last_login_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (restaurant_uuid) REFERENCES restaurants (uuid),
  FOREIGN KEY (outlet_uuid) REFERENCES outlets (uuid)
);

CREATE UNIQUE INDEX idx_users_restaurant_username ON users (restaurant_uuid, username);
CREATE INDEX idx_users_outlet_status ON users (outlet_uuid, status);
