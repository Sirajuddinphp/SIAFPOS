CREATE TABLE kot_items_new (
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
  FOREIGN KEY (kot_ticket_uuid) REFERENCES kot_tickets (uuid)
);

INSERT INTO kot_items_new (
  id, uuid, kot_ticket_uuid, order_item_uuid, product_uuid,
  item_name_snapshot, variant_name_snapshot, qty, line_action,
  kitchen_note_snapshot, modifier_snapshot_json, created_at
)
SELECT
  id, uuid, kot_ticket_uuid, order_item_uuid, product_uuid,
  item_name_snapshot, variant_name_snapshot, qty, line_action,
  kitchen_note_snapshot, modifier_snapshot_json, created_at
FROM kot_items;

DROP TABLE kot_items;
ALTER TABLE kot_items_new RENAME TO kot_items;

CREATE INDEX idx_kot_items_ticket_uuid ON kot_items (kot_ticket_uuid);
CREATE INDEX idx_kot_items_order_item_uuid ON kot_items (order_item_uuid);
