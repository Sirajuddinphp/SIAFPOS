CREATE TABLE IF NOT EXISTS online_channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  channel_type TEXT NOT NULL CHECK(channel_type IN ('qr','website','mealhi5','custom')),
  is_active INTEGER NOT NULL DEFAULT 1,
  auto_accept INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS qr_table_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  table_uuid TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1,
  generated_at TEXT NOT NULL,
  FOREIGN KEY(table_uuid) REFERENCES tables(uuid)
);

CREATE TABLE IF NOT EXISTS online_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  channel_uuid TEXT,
  external_order_id TEXT,
  order_type TEXT NOT NULL CHECK(order_type IN ('dine_in','takeaway','delivery')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','preparing','ready','completed','rejected','cancelled')),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  address_summary TEXT,
  table_uuid TEXT,
  notes TEXT,
  subtotal_minor INTEGER NOT NULL DEFAULT 0,
  tax_minor INTEGER NOT NULL DEFAULT 0,
  delivery_charge_minor INTEGER NOT NULL DEFAULT 0,
  grand_total_minor INTEGER NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid','paid','cod')),
  local_order_uuid TEXT,
  received_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(channel_uuid) REFERENCES online_channels(uuid),
  FOREIGN KEY(table_uuid) REFERENCES tables(uuid),
  FOREIGN KEY(local_order_uuid) REFERENCES orders(uuid)
);

CREATE TABLE IF NOT EXISTS online_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  online_order_uuid TEXT NOT NULL,
  product_uuid TEXT,
  item_name_snapshot TEXT NOT NULL,
  qty INTEGER NOT NULL CHECK(qty > 0),
  unit_price_minor INTEGER NOT NULL DEFAULT 0,
  line_total_minor INTEGER NOT NULL DEFAULT 0,
  modifiers_json TEXT NOT NULL DEFAULT '[]',
  note TEXT,
  FOREIGN KEY(online_order_uuid) REFERENCES online_orders(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_online_orders_status ON online_orders(status, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_online_orders_channel ON online_orders(channel_uuid, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_online_order_items_order ON online_order_items(online_order_uuid);
