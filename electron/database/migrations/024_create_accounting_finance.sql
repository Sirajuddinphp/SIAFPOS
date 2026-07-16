CREATE TABLE IF NOT EXISTS finance_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK(account_type IN ('cash','bank','expense','income','supplier','customer','tax','equity')),
  opening_balance_minor INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS finance_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  entry_date TEXT NOT NULL,
  entry_type TEXT NOT NULL CHECK(entry_type IN ('expense','income','supplier_payment','customer_receipt','journal')),
  account_uuid TEXT NOT NULL,
  counter_account_uuid TEXT,
  amount_minor INTEGER NOT NULL CHECK(amount_minor > 0),
  reference_type TEXT,
  reference_uuid TEXT,
  description TEXT NOT NULL,
  payment_mode TEXT NOT NULL DEFAULT 'cash',
  created_by_user_uuid TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(account_uuid) REFERENCES finance_accounts(uuid),
  FOREIGN KEY(counter_account_uuid) REFERENCES finance_accounts(uuid),
  FOREIGN KEY(created_by_user_uuid) REFERENCES users(uuid)
);

CREATE INDEX IF NOT EXISTS idx_finance_entries_date ON finance_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_finance_entries_type ON finance_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_finance_entries_account ON finance_entries(account_uuid);
