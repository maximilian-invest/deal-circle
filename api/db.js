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
    phone TEXT,
    company TEXT,
    address TEXT,
    postal_code TEXT,
    city TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_login_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

  CREATE TABLE IF NOT EXISTS password_resets (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    used_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets (user_id);

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    starts_at TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'limited', 'waitlist', 'closed')),
    fee_cents INTEGER NOT NULL DEFAULT 38000,
    max_attendees INTEGER,
    description TEXT,
    cover_path TEXT,
    is_main INTEGER NOT NULL DEFAULT 0,
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'members')),
    member_discount_pct INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events (starts_at);

  CREATE TABLE IF NOT EXISTS event_timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    time_label TEXT NOT NULL,
    label TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_timeline_event ON event_timeline (event_id, position);

  CREATE TABLE IF NOT EXISTS event_speakers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    name TEXT NOT NULL,
    bio TEXT,
    photo_path TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_speakers_event ON event_speakers (event_id, position);

  CREATE TABLE IF NOT EXISTS event_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    name TEXT NOT NULL,
    badge TEXT,
    featured INTEGER NOT NULL DEFAULT 0,
    price_cents INTEGER NOT NULL,
    member_discount_pct INTEGER NOT NULL DEFAULT 0,
    perks_json TEXT NOT NULL DEFAULT '[]'
  );

  CREATE INDEX IF NOT EXISTS idx_tickets_event ON event_tickets (event_id, position);

  CREATE TABLE IF NOT EXISTS vip_signups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE,
    phone TEXT NOT NULL,
    company TEXT,
    consent_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    processed_at TEXT,
    note TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_vip_signups_email ON vip_signups (email);
  CREATE INDEX IF NOT EXISTS idx_vip_signups_created ON vip_signups (created_at DESC);

  CREATE TABLE IF NOT EXISTS event_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticket_id INTEGER REFERENCES event_tickets(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'reserved'
      CHECK (status IN ('reserved','paid','waitlist','cancelled')),
    amount_cents INTEGER,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    paid_at TEXT,
    UNIQUE (event_id, user_id)
  );

  CREATE INDEX IF NOT EXISTS idx_event_regs_event ON event_registrations (event_id);
  CREATE INDEX IF NOT EXISTS idx_event_regs_user  ON event_registrations (user_id);

  CREATE TABLE IF NOT EXISTS event_mail_sends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('announcement','limited','soldout')),
    triggered_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    recipient_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_event_mail_sends_event ON event_mail_sends (event_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS event_guest_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    ticket_id INTEGER REFERENCES event_tickets(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE,
    status TEXT NOT NULL DEFAULT 'reserved'
      CHECK (status IN ('reserved','paid','cancelled')),
    amount_cents INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    paid_at TEXT,
    UNIQUE (event_id, email)
  );

  CREATE INDEX IF NOT EXISTS idx_event_guest_regs_event ON event_guest_registrations (event_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS membership_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE,
    phone TEXT NOT NULL,
    street TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Österreich',
    company TEXT NOT NULL,
    website TEXT,
    role TEXT,
    about TEXT NOT NULL,
    referral TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'accepted', 'rejected')),
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    reviewed_at TEXT,
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_membership_applications_status
    ON membership_applications (status, created_at DESC);
`);

// --- Migration: alte Spalten droppen (idempotent) -----------------------------
function migrateEventsSchema() {
  const cols = db.prepare("PRAGMA table_info(events)").all().map((c) => c.name);
  const deprecated = ["time_label", "confirmed_count", "photo_count", "speaker"];
  for (const col of deprecated) {
    if (cols.includes(col)) {
      console.log(`[migrate] events: drop column ${col}`);
      db.exec(`ALTER TABLE events DROP COLUMN ${col}`);
    }
  }
  if (!cols.includes("cover_path")) {
    console.log("[migrate] events: add column cover_path");
    db.exec("ALTER TABLE events ADD COLUMN cover_path TEXT");
  }
  if (!cols.includes("is_main")) {
    console.log("[migrate] events: add column is_main");
    db.exec("ALTER TABLE events ADD COLUMN is_main INTEGER NOT NULL DEFAULT 0");
  }
  if (!cols.includes("visibility")) {
    console.log("[migrate] events: add column visibility");
    db.exec("ALTER TABLE events ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public'");
  }
  if (!cols.includes("member_discount_pct")) {
    console.log("[migrate] events: add column member_discount_pct");
    db.exec("ALTER TABLE events ADD COLUMN member_discount_pct INTEGER NOT NULL DEFAULT 0");
  }

  // event_tickets: badge + featured
  const tcols = db.prepare("PRAGMA table_info(event_tickets)").all().map((c) => c.name);
  if (!tcols.includes("badge")) {
    console.log("[migrate] event_tickets: add column badge");
    db.exec("ALTER TABLE event_tickets ADD COLUMN badge TEXT");
  }
  if (!tcols.includes("featured")) {
    console.log("[migrate] event_tickets: add column featured");
    db.exec("ALTER TABLE event_tickets ADD COLUMN featured INTEGER NOT NULL DEFAULT 0");
  }
  if (!tcols.includes("member_discount_pct")) {
    console.log("[migrate] event_tickets: add column member_discount_pct");
    db.exec("ALTER TABLE event_tickets ADD COLUMN member_discount_pct INTEGER NOT NULL DEFAULT 0");
    // Bestehende Tickets erben den bisherigen event-weiten Mitglieder-Rabatt.
    db.exec("UPDATE event_tickets SET member_discount_pct = COALESCE((SELECT member_discount_pct FROM events WHERE events.id = event_tickets.event_id), 0)");
  }

  // users: phone + company
  const ucols = db.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
  if (!ucols.includes("phone")) {
    console.log("[migrate] users: add column phone");
    db.exec("ALTER TABLE users ADD COLUMN phone TEXT");
  }
  if (!ucols.includes("company")) {
    console.log("[migrate] users: add column company");
    db.exec("ALTER TABLE users ADD COLUMN company TEXT");
  }
  if (!ucols.includes("address")) {
    console.log("[migrate] users: add column address");
    db.exec("ALTER TABLE users ADD COLUMN address TEXT");
  }
  if (!ucols.includes("postal_code")) {
    console.log("[migrate] users: add column postal_code");
    db.exec("ALTER TABLE users ADD COLUMN postal_code TEXT");
  }
  if (!ucols.includes("city")) {
    console.log("[migrate] users: add column city");
    db.exec("ALTER TABLE users ADD COLUMN city TEXT");
  }

  // event_registrations: stripe columns + invoice link
  const rcols = db.prepare("PRAGMA table_info(event_registrations)").all().map((c) => c.name);
  if (!rcols.includes("stripe_session_id")) {
    console.log("[migrate] event_registrations: add column stripe_session_id");
    db.exec("ALTER TABLE event_registrations ADD COLUMN stripe_session_id TEXT");
  }
  if (!rcols.includes("stripe_payment_intent_id")) {
    console.log("[migrate] event_registrations: add column stripe_payment_intent_id");
    db.exec("ALTER TABLE event_registrations ADD COLUMN stripe_payment_intent_id TEXT");
  }
  if (!rcols.includes("stripe_invoice_id")) {
    console.log("[migrate] event_registrations: add column stripe_invoice_id");
    db.exec("ALTER TABLE event_registrations ADD COLUMN stripe_invoice_id TEXT");
  }
  if (!rcols.includes("invoice_url")) {
    console.log("[migrate] event_registrations: add column invoice_url");
    db.exec("ALTER TABLE event_registrations ADD COLUMN invoice_url TEXT");
  }
  if (!rcols.includes("amount_total_cents")) {
    console.log("[migrate] event_registrations: add column amount_total_cents (brutto incl. tax)");
    db.exec("ALTER TABLE event_registrations ADD COLUMN amount_total_cents INTEGER");
  }
  db.exec("CREATE INDEX IF NOT EXISTS idx_event_regs_stripe_session ON event_registrations (stripe_session_id)");

  // event_guest_registrations: stripe columns (Gast-Checkout ohne Login)
  const gcols = db.prepare("PRAGMA table_info(event_guest_registrations)").all().map((c) => c.name);
  for (const [col, type] of [
    ["stripe_session_id", "TEXT"],
    ["stripe_payment_intent_id", "TEXT"],
    ["stripe_invoice_id", "TEXT"],
    ["invoice_url", "TEXT"],
    ["amount_total_cents", "INTEGER"],
  ]) {
    if (!gcols.includes(col)) {
      console.log(`[migrate] event_guest_registrations: add column ${col}`);
      db.exec(`ALTER TABLE event_guest_registrations ADD COLUMN ${col} ${type}`);
    }
  }
  db.exec("CREATE INDEX IF NOT EXISTS idx_event_guest_regs_stripe_session ON event_guest_registrations (stripe_session_id)");
}
migrateEventsSchema();

// --- Bootstrap Admin ----------------------------------------------------------
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

// --- Bootstrap Sample-Events (nur bei leerer Tabelle) -------------------------
function bootstrapEvents() {
  const count = db.prepare("SELECT COUNT(*) AS n FROM events").get().n;
  if (count > 0) return;

  const inDays = (n, h = 18, m = 30) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  const samples = [
    {
      title: "Wiespach LXVII · Privatkapital im Mittelstand.",
      starts_at: inDays(33),
      location: "Schloss Wiespach, Hallein",
      status: "open",
      fee_cents: 38000, max_attendees: 32,
      description: "Privatkapital im Mittelstand — Fokus auf Familienunternehmen, Family Offices und stille Beteiligungen.",
    },
    {
      title: "Frühjahrsevent · Familienunternehmen & Nachfolge.",
      starts_at: inDays(120, 10, 0),
      location: "Schloss Wiespach, Hallein",
      status: "limited",
      fee_cents: 98000, max_attendees: 60,
      description: "Halbtagsformat zu Generationenwechsel, Nachfolgekonzepten und Cross-Familien-Kooperationen.",
    },
    {
      title: "Wiespach LXVIII · Energie & Infrastruktur.",
      starts_at: inDays(180),
      location: "Schloss Wiespach, Hallein",
      status: "open",
      fee_cents: 38000, max_attendees: 32,
      description: "Energiewende-Investments, Netzinfrastruktur, regionale Versorgungsmodelle.",
    },
    {
      title: "Sommerevent · Drei Tage am See.",
      starts_at: inDays(255, 16, 0),
      location: "St. Wolfgang am Wolfgangsee",
      status: "waitlist",
      fee_cents: 148000, max_attendees: 80,
      description: "Dreitägiges Hauptevent — gemischtes Programm, gemeinsame Aktivitäten, vertraulicher Rahmen.",
    },
    {
      title: "Wiespach LXVI · Bauwirtschaft im Umbruch.",
      starts_at: inDays(-30),
      location: "Schloss Wiespach, Hallein",
      status: "closed",
      fee_cents: 38000, max_attendees: 32,
      description: "Vortrag von einem Familienunternehmer aus Linz zu Margenverfall und Restrukturierung.",
    },
    {
      title: "Jahresabschluss 2025.",
      starts_at: inDays(-60, 10, 0),
      location: "Schloss Wiespach, Hallein",
      status: "closed",
      fee_cents: 98000, max_attendees: 60,
      description: "Drei Kurzbeiträge zu offenen Themen, gemeinsames Abendessen, Jahresrückblick.",
    },
  ];

  const insert = db.prepare(`
    INSERT INTO events (title, starts_at, location, status, fee_cents,
                        max_attendees, description)
    VALUES (@title, @starts_at, @location, @status, @fee_cents,
            @max_attendees, @description)
  `);
  const tx = db.transaction((rows) => {
    for (const r of rows) insert.run(r);
  });
  tx(samples);

  console.log(`[bootstrap] ${samples.length} Beispiel-Events angelegt`);
}
bootstrapEvents();

export default db;
