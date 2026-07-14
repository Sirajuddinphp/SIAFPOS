CREATE TABLE IF NOT EXISTS inventory_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sku TEXT,
  unit TEXT NOT NULL,
  reorder_level REAL NOT NULL DEFAULT 0,
  cost_per_unit_minor INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_items_sku ON inventory_items(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_items_name ON inventory_items(name);

CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  product_uuid TEXT NOT NULL UNIQUE,
  yield_qty REAL NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(product_uuid) REFERENCES products(uuid)
);
CREATE TABLE IF NOT EXISTS recipe_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  recipe_uuid TEXT NOT NULL,
  inventory_item_uuid TEXT NOT NULL,
  qty REAL NOT NULL CHECK(qty > 0),
  created_at TEXT NOT NULL,
  FOREIGN KEY(recipe_uuid) REFERENCES recipes(uuid) ON DELETE CASCADE,
  FOREIGN KEY(inventory_item_uuid) REFERENCES inventory_items(uuid)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_recipe_item_unique ON recipe_items(recipe_uuid,inventory_item_uuid);

CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  purchase_no TEXT NOT NULL UNIQUE,
  supplier_uuid TEXT,
  invoice_no TEXT,
  status TEXT NOT NULL CHECK(status IN ('draft','posted','cancelled')) DEFAULT 'draft',
  total_minor INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  purchased_at TEXT NOT NULL,
  posted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(supplier_uuid) REFERENCES suppliers(uuid)
);
CREATE TABLE IF NOT EXISTS purchase_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  purchase_uuid TEXT NOT NULL,
  inventory_item_uuid TEXT NOT NULL,
  qty REAL NOT NULL CHECK(qty > 0),
  unit_cost_minor INTEGER NOT NULL CHECK(unit_cost_minor >= 0),
  line_total_minor INTEGER NOT NULL CHECK(line_total_minor >= 0),
  created_at TEXT NOT NULL,
  FOREIGN KEY(purchase_uuid) REFERENCES purchases(uuid) ON DELETE CASCADE,
  FOREIGN KEY(inventory_item_uuid) REFERENCES inventory_items(uuid)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  inventory_item_uuid TEXT NOT NULL,
  movement_type TEXT NOT NULL CHECK(movement_type IN ('opening','purchase','sale','wastage','adjustment','return')),
  qty_delta REAL NOT NULL,
  unit_cost_minor INTEGER NOT NULL DEFAULT 0,
  reference_type TEXT,
  reference_uuid TEXT,
  notes TEXT,
  created_by_user_uuid TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(inventory_item_uuid) REFERENCES inventory_items(uuid),
  FOREIGN KEY(created_by_user_uuid) REFERENCES users(uuid)
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item_date ON stock_movements(inventory_item_uuid,created_at);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchased_at,status);
