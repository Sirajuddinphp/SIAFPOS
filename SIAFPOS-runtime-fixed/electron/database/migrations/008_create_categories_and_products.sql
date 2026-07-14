CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  category_uuid TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  barcode TEXT,
  base_price_minor INTEGER NOT NULL,
  gst_mode TEXT NOT NULL CHECK (gst_mode IN ('inclusive', 'exclusive')),
  gst_rate_basis_points INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  search_text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (category_uuid) REFERENCES categories (uuid)
);

CREATE TABLE product_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  product_uuid TEXT NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  price_minor INTEGER NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (product_uuid) REFERENCES products (uuid)
);

CREATE INDEX idx_categories_active_sort ON categories (is_active, sort_order);
CREATE INDEX idx_products_category_active_sort ON products (category_uuid, is_active, sort_order);
CREATE INDEX idx_products_barcode ON products (barcode);
CREATE INDEX idx_products_search_text ON products (search_text);
CREATE INDEX idx_variants_product_active ON product_variants (product_uuid, is_active);
CREATE INDEX idx_variants_barcode ON product_variants (barcode);
