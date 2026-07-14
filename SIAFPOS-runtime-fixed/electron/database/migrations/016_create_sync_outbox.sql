CREATE TABLE sync_outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  entity_type TEXT NOT NULL,
  entity_uuid TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('upsert','delete')),
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','syncing','synced','failed','conflict')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  next_attempt_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at TEXT
);

CREATE TABLE sync_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_push_at TEXT,
  last_pull_at TEXT,
  pull_cursor TEXT,
  last_error TEXT,
  updated_at TEXT NOT NULL
);

INSERT INTO sync_state (id, updated_at) VALUES (1, datetime('now'));

CREATE INDEX idx_sync_outbox_status_created ON sync_outbox (status, created_at);
CREATE INDEX idx_sync_outbox_entity ON sync_outbox (entity_type, entity_uuid);

CREATE TRIGGER trg_orders_sync_insert AFTER INSERT ON orders BEGIN
  INSERT INTO sync_outbox (uuid, entity_type, entity_uuid, operation, payload_json, created_at, updated_at)
  VALUES (lower(hex(randomblob(16))), 'order', NEW.uuid, 'upsert', json_object('uuid',NEW.uuid,'orderNo',NEW.order_no,'status',NEW.status,'updatedAt',NEW.updated_at), datetime('now'), datetime('now'));
END;
CREATE TRIGGER trg_orders_sync_update AFTER UPDATE ON orders BEGIN
  INSERT INTO sync_outbox (uuid, entity_type, entity_uuid, operation, payload_json, created_at, updated_at)
  VALUES (lower(hex(randomblob(16))), 'order', NEW.uuid, 'upsert', json_object('uuid',NEW.uuid,'orderNo',NEW.order_no,'status',NEW.status,'updatedAt',NEW.updated_at), datetime('now'), datetime('now'));
END;
CREATE TRIGGER trg_order_items_sync_insert AFTER INSERT ON order_items BEGIN
  INSERT INTO sync_outbox (uuid, entity_type, entity_uuid, operation, payload_json, created_at, updated_at)
  VALUES (lower(hex(randomblob(16))), 'order_item', NEW.uuid, 'upsert', json_object('uuid',NEW.uuid,'orderUuid',NEW.order_uuid,'productUuid',NEW.product_uuid,'qty',NEW.qty,'updatedAt',NEW.updated_at), datetime('now'), datetime('now'));
END;
CREATE TRIGGER trg_order_items_sync_update AFTER UPDATE ON order_items BEGIN
  INSERT INTO sync_outbox (uuid, entity_type, entity_uuid, operation, payload_json, created_at, updated_at)
  VALUES (lower(hex(randomblob(16))), 'order_item', NEW.uuid, 'upsert', json_object('uuid',NEW.uuid,'orderUuid',NEW.order_uuid,'productUuid',NEW.product_uuid,'qty',NEW.qty,'updatedAt',NEW.updated_at), datetime('now'), datetime('now'));
END;
CREATE TRIGGER trg_order_items_sync_delete AFTER DELETE ON order_items BEGIN
  INSERT INTO sync_outbox (uuid, entity_type, entity_uuid, operation, payload_json, created_at, updated_at)
  VALUES (lower(hex(randomblob(16))), 'order_item', OLD.uuid, 'delete', json_object('uuid',OLD.uuid,'orderUuid',OLD.order_uuid), datetime('now'), datetime('now'));
END;
CREATE TRIGGER trg_kot_sync_insert AFTER INSERT ON kot_tickets BEGIN
  INSERT INTO sync_outbox (uuid, entity_type, entity_uuid, operation, payload_json, created_at, updated_at)
  VALUES (lower(hex(randomblob(16))), 'kot', NEW.uuid, 'upsert', json_object('uuid',NEW.uuid,'orderUuid',NEW.order_uuid,'kotNo',NEW.kot_no,'status',NEW.status,'kind',NEW.kind,'updatedAt',NEW.updated_at), datetime('now'), datetime('now'));
END;
CREATE TRIGGER trg_kot_sync_update AFTER UPDATE ON kot_tickets BEGIN
  INSERT INTO sync_outbox (uuid, entity_type, entity_uuid, operation, payload_json, created_at, updated_at)
  VALUES (lower(hex(randomblob(16))), 'kot', NEW.uuid, 'upsert', json_object('uuid',NEW.uuid,'orderUuid',NEW.order_uuid,'kotNo',NEW.kot_no,'status',NEW.status,'kind',NEW.kind,'updatedAt',NEW.updated_at), datetime('now'), datetime('now'));
END;
CREATE TRIGGER trg_payments_sync_insert AFTER INSERT ON payments BEGIN
  INSERT INTO sync_outbox (uuid, entity_type, entity_uuid, operation, payload_json, created_at, updated_at)
  VALUES (lower(hex(randomblob(16))), 'payment', NEW.uuid, 'upsert', json_object('uuid',NEW.uuid,'billUuid',NEW.bill_uuid,'paymentMode',NEW.payment_mode,'amountMinor',NEW.amount_minor,'createdAt',NEW.created_at), datetime('now'), datetime('now'));
END;
CREATE TRIGGER trg_shifts_sync_insert AFTER INSERT ON cash_shifts BEGIN
  INSERT INTO sync_outbox (uuid, entity_type, entity_uuid, operation, payload_json, created_at, updated_at)
  VALUES (lower(hex(randomblob(16))), 'shift', NEW.uuid, 'upsert', json_object('uuid',NEW.uuid,'status',NEW.status,'openedAt',NEW.opened_at), datetime('now'), datetime('now'));
END;
CREATE TRIGGER trg_shifts_sync_update AFTER UPDATE ON cash_shifts BEGIN
  INSERT INTO sync_outbox (uuid, entity_type, entity_uuid, operation, payload_json, created_at, updated_at)
  VALUES (lower(hex(randomblob(16))), 'shift', NEW.uuid, 'upsert', json_object('uuid',NEW.uuid,'status',NEW.status,'openedAt',NEW.opened_at,'closedAt',NEW.closed_at), datetime('now'), datetime('now'));
END;
