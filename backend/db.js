import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, "data.sqlite"));

db.pragma("journal_mode = WAL");

// Single table is enough for this scope: one business, no auth, no relations
// beyond testimonial -> photo. Status is the whole workflow state machine.
db.exec(`
  CREATE TABLE IF NOT EXISTS testimonials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    body TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    photo_path TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    dedupe_key TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    decided_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_status ON testimonials (status, created_at);
  CREATE INDEX IF NOT EXISTS idx_dedupe ON testimonials (dedupe_key);
`);

export default db;
