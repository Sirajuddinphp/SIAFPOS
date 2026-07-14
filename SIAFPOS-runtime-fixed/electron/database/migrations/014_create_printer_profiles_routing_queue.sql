CREATE TABLE printer_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('receipt','kitchen','bar','cashier')),
  connection_type TEXT NOT NULL CHECK (connection_type IN ('mock','lan','usb')),
  host TEXT,
  port INTEGER,
  device_path TEXT,
  paper_width_mm INTEGER NOT NULL DEFAULT 80 CHECK (paper_width_mm IN (58,80)),
  characters_per_line INTEGER NOT NULL DEFAULT 48,
  auto_cut INTEGER NOT NULL DEFAULT 1,
  open_cash_drawer INTEGER NOT NULL DEFAULT 0,
  is_default INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE printer_routes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  document_type TEXT NOT NULL CHECK (document_type IN ('receipt','kot')),
  category_uuid TEXT,
  printer_uuid TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (category_uuid) REFERENCES categories (uuid),
  FOREIGN KEY (printer_uuid) REFERENCES printer_profiles (uuid)
);

ALTER TABLE print_jobs ADD COLUMN printer_uuid TEXT;
ALTER TABLE print_jobs ADD COLUMN job_kind TEXT NOT NULL DEFAULT 'print' CHECK (job_kind IN ('print','test','drawer'));
ALTER TABLE print_jobs ADD COLUMN next_attempt_at TEXT;
ALTER TABLE print_jobs ADD COLUMN updated_at TEXT;
ALTER TABLE print_jobs ADD COLUMN cancelled_at TEXT;

CREATE INDEX idx_printer_profiles_role_active ON printer_profiles (role, is_active);
CREATE INDEX idx_printer_routes_document_category ON printer_routes (document_type, category_uuid, priority);
CREATE INDEX idx_print_jobs_printer_status ON print_jobs (printer_uuid, status, created_at);
