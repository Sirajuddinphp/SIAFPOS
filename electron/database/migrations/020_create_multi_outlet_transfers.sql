CREATE TABLE outlet_inventory_balances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  outlet_uuid TEXT NOT NULL,
  inventory_item_uuid TEXT NOT NULL,
  on_hand REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  UNIQUE(outlet_uuid, inventory_item_uuid),
  FOREIGN KEY(outlet_uuid) REFERENCES outlets(uuid),
  FOREIGN KEY(inventory_item_uuid) REFERENCES inventory_items(uuid)
);

CREATE TABLE stock_transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  transfer_no TEXT NOT NULL UNIQUE,
  from_outlet_uuid TEXT NOT NULL,
  to_outlet_uuid TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('draft','sent','received','cancelled')) DEFAULT 'draft',
  notes TEXT,
  created_by_user_uuid TEXT NOT NULL,
  created_at TEXT NOT NULL,
  sent_at TEXT,
  received_at TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(from_outlet_uuid) REFERENCES outlets(uuid),
  FOREIGN KEY(to_outlet_uuid) REFERENCES outlets(uuid),
  FOREIGN KEY(created_by_user_uuid) REFERENCES users(uuid),
  CHECK(from_outlet_uuid <> to_outlet_uuid)
);

CREATE TABLE stock_transfer_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  transfer_uuid TEXT NOT NULL,
  inventory_item_uuid TEXT NOT NULL,
  qty REAL NOT NULL CHECK(qty > 0),
  created_at TEXT NOT NULL,
  FOREIGN KEY(transfer_uuid) REFERENCES stock_transfers(uuid) ON DELETE CASCADE,
  FOREIGN KEY(inventory_item_uuid) REFERENCES inventory_items(uuid)
);

CREATE INDEX idx_stock_transfers_status_date ON stock_transfers(status,created_at);
CREATE INDEX idx_transfer_items_transfer ON stock_transfer_items(transfer_uuid);
