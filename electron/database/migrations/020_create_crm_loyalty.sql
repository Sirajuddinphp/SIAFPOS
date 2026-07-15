CREATE TABLE IF NOT EXISTS loyalty_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_uuid TEXT NOT NULL UNIQUE,
  points_balance INTEGER NOT NULL DEFAULT 0,
  wallet_minor INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'standard' CHECK(tier IN ('standard','silver','gold','platinum')),
  updated_at TEXT NOT NULL,
  FOREIGN KEY(customer_uuid) REFERENCES customers(uuid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  customer_uuid TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK(transaction_type IN ('points','wallet')),
  direction TEXT NOT NULL CHECK(direction IN ('credit','debit')),
  amount INTEGER NOT NULL CHECK(amount > 0),
  reason TEXT NOT NULL,
  reference_type TEXT,
  reference_uuid TEXT,
  created_by_user_uuid TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(customer_uuid) REFERENCES customers(uuid),
  FOREIGN KEY(created_by_user_uuid) REFERENCES users(uuid)
);

CREATE TABLE IF NOT EXISTS coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK(discount_type IN ('fixed','percentage')),
  discount_value INTEGER NOT NULL CHECK(discount_value > 0),
  min_order_minor INTEGER NOT NULL DEFAULT 0,
  max_discount_minor INTEGER,
  starts_at TEXT,
  ends_at TEXT,
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customer_memberships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  customer_uuid TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','expired','cancelled')),
  benefits_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(customer_uuid) REFERENCES customers(uuid)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer ON loyalty_transactions(customer_uuid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active, code);
CREATE INDEX IF NOT EXISTS idx_memberships_customer ON customer_memberships(customer_uuid, status);
