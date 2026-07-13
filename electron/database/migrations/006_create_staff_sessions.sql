CREATE TABLE staff_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  user_uuid TEXT NOT NULL,
  terminal_uuid TEXT NOT NULL,
  login_at TEXT NOT NULL,
  logout_at TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_uuid) REFERENCES users (uuid),
  FOREIGN KEY (terminal_uuid) REFERENCES terminals (uuid)
);

CREATE INDEX idx_staff_sessions_user_status ON staff_sessions (user_uuid, status);
CREATE INDEX idx_staff_sessions_terminal_status ON staff_sessions (terminal_uuid, status);
