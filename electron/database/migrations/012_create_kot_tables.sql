CREATE TABLE kot_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  order_uuid TEXT NOT NULL,
  kot_no TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('new', 'preparing', 'ready', 'completed')),
  kind TEXT NOT NULL CHECK (kind IN ('full', 'delta', 'cancel', 'reprint')),
  reference_kot_uuid TEXT,
  created_by_user_uuid TEXT,
  printed_at TEXT,
  cancelled_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (order_uuid) REFERENCES orders (uuid),
  FOREIGN KEY (reference_kot_uuid) REFERENCES kot_tickets (uuid),
  FOREIGN KEY (created_by_user_uuid) REFERENCES users (uuid)
);

CREATE TABLE kot_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  kot_ticket_uuid TEXT NOT NULL,
  order_item_uuid TEXT NOT NULL,
  product_uuid TEXT NOT NULL,
  item_name_snapshot TEXT NOT NULL,
  variant_name_snapshot TEXT,
  qty INTEGER NOT NULL CHECK (qty > 0),
  line_action TEXT NOT NULL CHECK (line_action IN ('add', 'update', 'cancel')),
  kitchen_note_snapshot TEXT,
  modifier_snapshot_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (kot_ticket_uuid) REFERENCES kot_tickets (uuid),
  FOREIGN KEY (order_item_uuid) REFERENCES order_items (uuid)
);

CREATE TABLE kot_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  kot_ticket_uuid TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL CHECK (to_status IN ('new', 'preparing', 'ready', 'completed')),
  changed_by_user_uuid TEXT,
  reason TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (kot_ticket_uuid) REFERENCES kot_tickets (uuid),
  FOREIGN KEY (changed_by_user_uuid) REFERENCES users (uuid)
);

CREATE INDEX idx_kot_tickets_order_created ON kot_tickets (order_uuid, created_at DESC);
CREATE INDEX idx_kot_tickets_status_created ON kot_tickets (status, created_at DESC);
CREATE INDEX idx_kot_tickets_reference ON kot_tickets (reference_kot_uuid);
CREATE INDEX idx_kot_items_ticket_uuid ON kot_items (kot_ticket_uuid);
CREATE INDEX idx_kot_items_order_item_uuid ON kot_items (order_item_uuid);
CREATE INDEX idx_kot_history_ticket_created ON kot_status_history (kot_ticket_uuid, created_at DESC);
