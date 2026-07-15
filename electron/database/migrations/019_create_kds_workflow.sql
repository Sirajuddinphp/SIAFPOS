ALTER TABLE kot_tickets ADD COLUMN kitchen_station TEXT NOT NULL DEFAULT 'Main Kitchen';
ALTER TABLE kot_tickets ADD COLUMN priority INTEGER NOT NULL DEFAULT 0;
ALTER TABLE kot_tickets ADD COLUMN started_at TEXT;
ALTER TABLE kot_tickets ADD COLUMN ready_at TEXT;
ALTER TABLE kot_tickets ADD COLUMN completed_at TEXT;

CREATE INDEX IF NOT EXISTS idx_kot_tickets_kds_queue
  ON kot_tickets (kitchen_station, status, priority, created_at);
