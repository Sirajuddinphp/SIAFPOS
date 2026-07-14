CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  user_uuid TEXT,
  terminal_uuid TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_uuid TEXT,
  old_values TEXT,
  new_values TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_uuid) REFERENCES users (uuid),
  FOREIGN KEY (terminal_uuid) REFERENCES terminals (uuid)
);

CREATE INDEX idx_audit_logs_user_uuid ON audit_logs (user_uuid);
CREATE INDEX idx_audit_logs_terminal_uuid ON audit_logs (terminal_uuid);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_uuid);
