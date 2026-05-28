import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = process.env.DC_DB_PATH || "./data/db.sqlite";
const ADMIN_EMAIL = process.env.DC_ADMIN_EMAIL || "max@deal-circle.at";
const ADMIN_PASSWORD = process.env.DC_ADMIN_PASSWORD || "55default";
const ADMIN_NAME = process.env.DC_ADMIN_NAME || "Maximilian";

mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_login_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
`);

function bootstrapAdmin() {
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(ADMIN_EMAIL);
  if (existing) return;

  const hash = bcrypt.hashSync(ADMIN_PASSWORD, 11);
  db.prepare(
    "INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, 'admin')"
  ).run(ADMIN_EMAIL, ADMIN_NAME, hash);

  console.log(`[bootstrap] admin angelegt: ${ADMIN_EMAIL}`);
}

bootstrapAdmin();

export default db;
