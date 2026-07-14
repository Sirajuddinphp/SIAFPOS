CREATE TABLE cash_shifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  terminal_uuid TEXT NOT NULL,
  user_uuid TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open','closed')),
  opening_cash_minor INTEGER NOT NULL DEFAULT 0,
  expected_cash_minor INTEGER NOT NULL DEFAULT 0,
  actual_cash_minor INTEGER,
  difference_minor INTEGER,
  opened_at TEXT NOT NULL,
  closed_at TEXT,
  closing_note TEXT,
  FOREIGN KEY (terminal_uuid) REFERENCES terminals (uuid),
  FOREIGN KEY (user_uuid) REFERENCES users (uuid)
);

CREATE TABLE bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  bill_no TEXT NOT NULL UNIQUE,
  order_uuid TEXT NOT NULL UNIQUE,
  shift_uuid TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open','settled','void')),
  subtotal_minor INTEGER NOT NULL,
  discount_minor INTEGER NOT NULL,
  taxable_minor INTEGER NOT NULL,
  tax_minor INTEGER NOT NULL,
  grand_total_minor INTEGER NOT NULL,
  paid_minor INTEGER NOT NULL DEFAULT 0,
  balance_minor INTEGER NOT NULL DEFAULT 0,
  settled_at TEXT,
  created_by_user_uuid TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (order_uuid) REFERENCES orders (uuid),
  FOREIGN KEY (shift_uuid) REFERENCES cash_shifts (uuid),
  FOREIGN KEY (created_by_user_uuid) REFERENCES users (uuid)
);

CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  bill_uuid TEXT NOT NULL,
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('cash','upi','card','credit','custom')),
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  reference TEXT,
  received_minor INTEGER,
  change_minor INTEGER NOT NULL DEFAULT 0,
  created_by_user_uuid TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (bill_uuid) REFERENCES bills (uuid),
  FOREIGN KEY (created_by_user_uuid) REFERENCES users (uuid)
);

CREATE TABLE print_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  document_type TEXT NOT NULL CHECK (document_type IN ('receipt','kot')),
  document_uuid TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','printed','failed')),
  copy_type TEXT NOT NULL CHECK (copy_type IN ('original','duplicate')),
  payload_json TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_by_user_uuid TEXT NOT NULL,
  created_at TEXT NOT NULL,
  printed_at TEXT,
  FOREIGN KEY (created_by_user_uuid) REFERENCES users (uuid)
);

CREATE INDEX idx_cash_shifts_terminal_status ON cash_shifts (terminal_uuid, status);
CREATE INDEX idx_bills_shift_status ON bills (shift_uuid, status);
CREATE INDEX idx_payments_bill_uuid ON payments (bill_uuid);
CREATE INDEX idx_print_jobs_status_created ON print_jobs (status, created_at);
