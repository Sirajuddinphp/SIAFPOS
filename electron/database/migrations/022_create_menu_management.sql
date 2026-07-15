ALTER TABLE products ADD COLUMN kitchen_station TEXT NOT NULL DEFAULT 'main_kitchen';
ALTER TABLE products ADD COLUMN is_online_visible INTEGER NOT NULL DEFAULT 1 CHECK (is_online_visible IN (0,1));
ALTER TABLE products ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0 CHECK (is_favorite IN (0,1));
ALTER TABLE products ADD COLUMN image_url TEXT;

CREATE INDEX IF NOT EXISTS idx_products_online_visible ON products(is_online_visible,is_active);
CREATE INDEX IF NOT EXISTS idx_products_kitchen_station ON products(kitchen_station,is_active);
