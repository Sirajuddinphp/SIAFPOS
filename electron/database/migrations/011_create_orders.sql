CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  order_no TEXT NOT NULL UNIQUE,
  order_type TEXT NOT NULL CHECK (order_type IN ('dine_in', 'takeaway', 'delivery')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'held')),
  customer_uuid TEXT,
  table_uuid TEXT,
  waiter_uuid TEXT,
  discount_type TEXT CHECK (discount_type IN ('fixed', 'percentage')),
  discount_value REAL,
  discount_amount_minor INTEGER NOT NULL DEFAULT 0,
  subtotal_minor INTEGER NOT NULL DEFAULT 0,
  taxable_minor INTEGER NOT NULL DEFAULT 0,
  tax_minor INTEGER NOT NULL DEFAULT 0,
  grand_total_minor INTEGER NOT NULL DEFAULT 0,
  held_at TEXT,
  opened_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by_user_uuid TEXT,
  terminal_uuid TEXT,
  FOREIGN KEY (customer_uuid) REFERENCES customers (uuid),
  FOREIGN KEY (table_uuid) REFERENCES tables (uuid),
  FOREIGN KEY (waiter_uuid) REFERENCES waiters (uuid),
  FOREIGN KEY (created_by_user_uuid) REFERENCES users (uuid),
  FOREIGN KEY (terminal_uuid) REFERENCES terminals (uuid)
);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  order_uuid TEXT NOT NULL,
  product_uuid TEXT NOT NULL,
  product_name TEXT NOT NULL,
  variant_uuid TEXT,
  variant_name TEXT,
  qty INTEGER NOT NULL,
  unit_price_minor INTEGER NOT NULL,
  gst_mode TEXT NOT NULL CHECK (gst_mode IN ('inclusive', 'exclusive')),
  gst_rate_basis_points INTEGER NOT NULL DEFAULT 0,
  kitchen_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (order_uuid) REFERENCES orders (uuid),
  FOREIGN KEY (product_uuid) REFERENCES products (uuid),
  FOREIGN KEY (variant_uuid) REFERENCES product_variants (uuid)
);

CREATE TABLE order_item_modifiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  order_item_uuid TEXT NOT NULL,
  modifier_uuid TEXT NOT NULL,
  modifier_group_uuid TEXT NOT NULL,
  name TEXT NOT NULL,
  price_delta_minor INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (order_item_uuid) REFERENCES order_items (uuid),
  FOREIGN KEY (modifier_uuid) REFERENCES modifiers (uuid),
  FOREIGN KEY (modifier_group_uuid) REFERENCES modifier_groups (uuid)
);

CREATE TABLE held_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_uuid TEXT NOT NULL UNIQUE,
  held_at TEXT NOT NULL,
  held_by_user_uuid TEXT,
  note TEXT,
  FOREIGN KEY (order_uuid) REFERENCES orders (uuid),
  FOREIGN KEY (held_by_user_uuid) REFERENCES users (uuid)
);

CREATE INDEX idx_orders_status_type_updated ON orders (status, order_type, updated_at);
CREATE INDEX idx_orders_table_status ON orders (table_uuid, status);
CREATE INDEX idx_order_items_order_uuid ON order_items (order_uuid);
CREATE INDEX idx_order_item_modifiers_item_uuid ON order_item_modifiers (order_item_uuid);
CREATE INDEX idx_held_orders_held_at ON held_orders (held_at);
