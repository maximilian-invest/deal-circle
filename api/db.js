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

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    starts_at TEXT NOT NULL,
    time_label TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'limited', 'waitlist', 'closed')),
    fee_cents INTEGER NOT NULL DEFAULT 38000,
    max_attendees INTEGER,
    confirmed_count INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    speaker TEXT,
    photo_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events (starts_at);
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

function bootstrapEvents() {
  const count = db.prepare("SELECT COUNT(*) AS n FROM events").get().n;
  if (count > 0) return;

  // Datumshilfe: relativ zu heute
  const inDays = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    d.setHours(18, 30, 0, 0);
    return d.toISOString();
  };

  const samples = [
    {
      title: "Wiespach LXVII · Privatkapital im Mittelstand.",
      starts_at: inDays(33), time_label: "18:30 – 22:30",
      location: "Schloss Wiespach, Hallein", status: "open",
      fee_cents: 38000, max_attendees: 32, confirmed_count: 24,
      description: "Privatkapital im Mittelstand — Fokus auf Familienunternehmen, Family Offices und stille Beteiligungen.",
    },
    {
      title: "Frühjahrsevent · Familienunternehmen & Nachfolge.",
      starts_at: inDays(120), time_label: "Ganztägig",
      location: "Schloss Wiespach, Hallein", status: "limited",
      fee_cents: 98000, max_attendees: 60, confirmed_count: 52,
      description: "Halbtagsformat zu Generationenwechsel, Nachfolgekonzepten und Cross-Familien-Kooperationen.",
    },
    {
      title: "Wiespach LXVIII · Energie & Infrastruktur.",
      starts_at: inDays(180), time_label: "18:30 – 22:30",
      location: "Schloss Wiespach, Hallein", status: "open",
      fee_cents: 38000, max_attendees: 32, confirmed_count: 8,
      description: "Energiewende-Investments, Netzinfrastruktur, regionale Versorgungsmodelle.",
    },
    {
      title: "Sommerevent · Drei Tage am See.",
      starts_at: inDays(255), time_label: "Mehrtägig",
      location: "St. Wolfgang am Wolfgangsee", status: "waitlist",
      fee_cents: 148000, max_attendees: 80, confirmed_count: 80,
      description: "Dreitägiges Hauptevent — gemischtes Programm, gemeinsame Aktivitäten, vertraulicher Rahmen.",
    },
    {
      title: "Wiespach LXVI · Bauwirtschaft im Umbruch.",
      starts_at: inDays(-30), time_label: "18:30 – 22:30",
      location: "Schloss Wiespach, Hallein", status: "closed",
      fee_cents: 38000, max_attendees: 32, confirmed_count: 28,
      description: "Vortrag von einem Familienunternehmer aus Linz zu Margenverfall und Restrukturierung.",
      speaker: "Vortrag: Familienunternehmer aus Linz", photo_count: 38,
    },
    {
      title: "Jahresabschluss 2025.",
      starts_at: inDays(-60), time_label: "Ganztägig",
      location: "Schloss Wiespach, Hallein", status: "closed",
      fee_cents: 98000, max_attendees: 60, confirmed_count: 48,
      description: "Drei Kurzbeiträge zu offenen Themen, gemeinsames Abendessen, Jahresrückblick.",
      speaker: "Drei Beiträge, gemeinsames Dinner", photo_count: 64,
    },
  ];

  const insert = db.prepare(`
    INSERT INTO events (title, starts_at, time_label, location, status, fee_cents,
                        max_attendees, confirmed_count, description, speaker, photo_count)
    VALUES (@title, @starts_at, @time_label, @location, @status, @fee_cents,
            @max_attendees, @confirmed_count, @description, @speaker, @photo_count)
  `);
  const tx = db.transaction((rows) => {
    for (const r of rows) {
      insert.run({
        ...r,
        speaker: r.speaker ?? null,
        photo_count: r.photo_count ?? 0,
      });
    }
  });
  tx(samples);

  console.log(`[bootstrap] ${samples.length} Beispiel-Events angelegt`);
}

bootstrapEvents();

export default db;
