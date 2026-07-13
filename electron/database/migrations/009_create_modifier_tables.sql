CREATE TABLE modifier_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  min_select INTEGER NOT NULL DEFAULT 0,
  max_select INTEGER NOT NULL DEFAULT 1,
  is_required INTEGER NOT NULL DEFAULT 0 CHECK (is_required IN (0, 1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE modifiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  modifier_group_uuid TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  price_delta_minor INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (modifier_group_uuid) REFERENCES modifier_groups (uuid)
);

CREATE TABLE product_modifier_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_uuid TEXT NOT NULL,
  modifier_group_uuid TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  UNIQUE (product_uuid, modifier_group_uuid),
  FOREIGN KEY (product_uuid) REFERENCES products (uuid),
  FOREIGN KEY (modifier_group_uuid) REFERENCES modifier_groups (uuid)
);

CREATE INDEX idx_modifier_groups_active ON modifier_groups (is_active);
CREATE INDEX idx_modifiers_group_active ON modifiers (modifier_group_uuid, is_active);
CREATE INDEX idx_product_modifier_groups_product ON product_modifier_groups (product_uuid, sort_order);
