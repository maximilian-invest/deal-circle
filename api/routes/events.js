import { Router } from "express";
import { z } from "zod";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ---------- MEMBER: meine Anmeldungen ----------
router.get("/me/registrations", requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT r.id, r.event_id, r.ticket_id, r.status, r.amount_cents,
           r.created_at, r.paid_at,
           e.title AS event_title, e.starts_at, e.location,
           t.name AS ticket_name
    FROM event_registrations r
    JOIN events e ON e.id = r.event_id
    LEFT JOIN event_tickets t ON t.id = r.ticket_id
    WHERE r.user_id = ?
    ORDER BY e.starts_at ASC
  `).all(req.user.sub);
  res.json({ registrations: rows });
});

// ---------- MEMBER: anmelden ----------
const registerSchema = z.object({
  ticket_id: z.number().int().min(1).nullable().optional(),
});

router.post("/:id/register", requireAuth, (req, res) => {
  const eventId = Number(req.params.id);
  if (!Number.isInteger(eventId) || eventId < 1) return res.status(400).json({ error: "invalid_id" });

  const parsed = registerSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });
  const ticketId = parsed.data.ticket_id ?? null;

  const event = db.prepare(
    "SELECT id, status, fee_cents, member_discount_pct FROM events WHERE id = ?"
  ).get(eventId);
  if (!event) return res.status(404).json({ error: "not_found" });
  if (event.status === "closed") return res.status(409).json({ error: "event_closed" });

  // Already registered?
  const existing = db.prepare(
    "SELECT id, status FROM event_registrations WHERE event_id = ? AND user_id = ?"
  ).get(eventId, req.user.sub);
  if (existing && existing.status !== "cancelled") {
    return res.status(409).json({ error: "already_registered", registration_id: existing.id });
  }

  // Ticket preis ableiten
  let amountCents = event.fee_cents;
  if (ticketId) {
    const t = db.prepare(
      "SELECT id, price_cents FROM event_tickets WHERE id = ? AND event_id = ?"
    ).get(ticketId, eventId);
    if (!t) return res.status(400).json({ error: "invalid_ticket" });
    amountCents = t.price_cents;
  }

  // Eingeloggte Mitglieder bekommen den Mitglieder-Rabatt des Events.
  const pct = event.member_discount_pct || 0;
  if (pct > 0) amountCents = Math.round((amountCents * (100 - pct)) / 100);

  // Status: bei waitlist-Event automatisch auf Warteliste, sonst 'reserved'
  const status = event.status === "waitlist" ? "waitlist" : "reserved";

  let info;
  if (existing) {
    // Wiederbeleben
    db.prepare(`
      UPDATE event_registrations
      SET status = ?, ticket_id = ?, amount_cents = ?, created_at = datetime('now')
      WHERE id = ?
    `).run(status, ticketId, amountCents, existing.id);
    info = { lastInsertRowid: existing.id };
  } else {
    info = db.prepare(`
      INSERT INTO event_registrations (event_id, user_id, ticket_id, amount_cents, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(eventId, req.user.sub, ticketId, amountCents, status);
  }

  res.status(201).json({
    ok: true,
    registration: {
      id: info.lastInsertRowid,
      event_id: eventId,
      ticket_id: ticketId,
      status,
      amount_cents: amountCents,
    },
  });
});

// ---------- MEMBER: eigene Anmeldung stornieren ----------
router.delete("/:id/register", requireAuth, (req, res) => {
  const eventId = Number(req.params.id);
  if (!Number.isInteger(eventId) || eventId < 1) return res.status(400).json({ error: "invalid_id" });

  db.prepare(`
    UPDATE event_registrations SET status = 'cancelled'
    WHERE event_id = ? AND user_id = ?
  `).run(eventId, req.user.sub);
  res.json({ ok: true });
});

// ---------- PUBLIC (Gast): Ticket ohne Login reservieren ----------
// Nur für öffentliche Events. Gäste zahlen den regulären Preis (kein
// Mitglieder-Rabatt). Name + E-Mail genügen.
const guestRegisterSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  ticket_id: z.number().int().min(1).nullable().optional(),
});

router.post("/:id/register-guest", (req, res) => {
  const eventId = Number(req.params.id);
  if (!Number.isInteger(eventId) || eventId < 1) return res.status(400).json({ error: "invalid_id" });

  const parsed = guestRegisterSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });
  const name = parsed.data.name.trim();
  const email = parsed.data.email.trim();
  const ticketId = parsed.data.ticket_id ?? null;

  const event = db.prepare(
    "SELECT id, status, fee_cents, visibility FROM events WHERE id = ?"
  ).get(eventId);
  if (!event) return res.status(404).json({ error: "not_found" });
  if (event.visibility !== "public") return res.status(403).json({ error: "members_only" });
  if (event.status === "closed") return res.status(409).json({ error: "event_closed" });

  let amountCents = event.fee_cents;
  if (ticketId) {
    const t = db.prepare(
      "SELECT id, price_cents FROM event_tickets WHERE id = ? AND event_id = ?"
    ).get(ticketId, eventId);
    if (!t) return res.status(400).json({ error: "invalid_ticket" });
    amountCents = t.price_cents;
  }

  const existing = db.prepare(
    "SELECT id, status FROM event_guest_registrations WHERE event_id = ? AND email = ?"
  ).get(eventId, email);
  if (existing && existing.status !== "cancelled") {
    return res.status(409).json({ error: "already_registered" });
  }

  let info;
  if (existing) {
    db.prepare(`
      UPDATE event_guest_registrations
      SET status = 'reserved', name = ?, ticket_id = ?, amount_cents = ?, created_at = datetime('now')
      WHERE id = ?
    `).run(name, ticketId, amountCents, existing.id);
    info = { lastInsertRowid: existing.id };
  } else {
    info = db.prepare(`
      INSERT INTO event_guest_registrations (event_id, ticket_id, name, email, amount_cents, status)
      VALUES (?, ?, ?, ?, ?, 'reserved')
    `).run(eventId, ticketId, name, email, amountCents);
  }

  res.status(201).json({
    ok: true,
    registration: {
      id: info.lastInsertRowid,
      event_id: eventId,
      ticket_id: ticketId,
      status: "reserved",
      amount_cents: amountCents,
    },
  });
});

// Public: Main-Event fuer den Startseiten-Banner.
// Zeigt NUR ein als "Main Event" getaggtes (oeffentliches, kommendes) Event.
// Ist keines getaggt, kommt null zurueck -> der Banner bleibt leer.
router.get("/public/next", (_req, res) => {
  const row = db
    .prepare(`
      SELECT id, title, starts_at, location, status, is_main
      FROM events
      WHERE starts_at >= datetime('now')
        AND status != 'closed'
        AND visibility = 'public'
        AND is_main = 1
      ORDER BY starts_at ASC
      LIMIT 1
    `)
    .get();

  if (row) row.is_main = row.is_main === 1;
  res.json({ event: row || null });
});

// Vollstaendiges Event fuer die Landingpage (Preis, Programm, Speaker, Tickets).
// Liefert visibility mit, damit die Aufrufer die Sichtbarkeit pruefen koennen.
function loadLandingEvent(id) {
  const ev = db
    .prepare(`
      SELECT id, title, starts_at, location, status,
             fee_cents, max_attendees, description, cover_path, visibility,
             member_discount_pct
      FROM events WHERE id = ?
    `)
    .get(id);
  if (!ev) return null;

  ev.timeline = db
    .prepare(`
      SELECT id, time_label, label FROM event_timeline
      WHERE event_id = ? ORDER BY position ASC
    `)
    .all(id);
  ev.speakers = db
    .prepare(`
      SELECT id, name, bio, photo_path FROM event_speakers
      WHERE event_id = ? ORDER BY position ASC
    `)
    .all(id);
  ev.tickets = db
    .prepare(`
      SELECT id, name, badge, featured, price_cents, perks_json FROM event_tickets
      WHERE event_id = ? ORDER BY position ASC
    `)
    .all(id)
    .map((t) => ({
      id: t.id,
      name: t.name,
      badge: t.badge,
      featured: t.featured === 1,
      price_cents: t.price_cents,
      perks: safeJson(t.perks_json),
    }));
  return ev;
}

// Public: ein einzelnes OEFFENTLICHES Event fuer die Event-Landingpage.
// Nur-Mitglieder-Events sind hier nicht abrufbar (404).
router.get("/public/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "invalid_id" });

  const ev = loadLandingEvent(id);
  if (!ev || ev.visibility !== "public") return res.status(404).json({ error: "not_found" });
  delete ev.visibility;
  res.json({ event: ev });
});

function safeJson(s) {
  try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; }
  catch { return []; }
}

// Member: alle Events mit nested timeline + speakers
router.get("/", requireAuth, (_req, res) => {
  const events = db
    .prepare(`
      SELECT id, title, starts_at, location, status,
             fee_cents, max_attendees, description, cover_path,
             is_main, visibility, member_discount_pct, created_at, updated_at
      FROM events
      ORDER BY starts_at ASC
    `)
    .all();

  const timelineByEvent = new Map();
  const speakersByEvent = new Map();
  const ticketsByEvent  = new Map();

  if (events.length) {
    const ids = events.map((e) => e.id);
    const placeholders = ids.map(() => "?").join(",");

    const tlRows = db
      .prepare(`
        SELECT event_id, id, time_label, label
        FROM event_timeline
        WHERE event_id IN (${placeholders})
        ORDER BY event_id, position
      `)
      .all(...ids);
    for (const r of tlRows) {
      if (!timelineByEvent.has(r.event_id)) timelineByEvent.set(r.event_id, []);
      timelineByEvent.get(r.event_id).push({ id: r.id, time_label: r.time_label, label: r.label });
    }

    const spRows = db
      .prepare(`
        SELECT event_id, id, name, bio, photo_path
        FROM event_speakers
        WHERE event_id IN (${placeholders})
        ORDER BY event_id, position
      `)
      .all(...ids);
    for (const r of spRows) {
      if (!speakersByEvent.has(r.event_id)) speakersByEvent.set(r.event_id, []);
      speakersByEvent.get(r.event_id).push({ id: r.id, name: r.name, bio: r.bio, photo_path: r.photo_path });
    }

    const tkRows = db
      .prepare(`
        SELECT event_id, id, name, badge, featured, price_cents, perks_json
        FROM event_tickets
        WHERE event_id IN (${placeholders})
        ORDER BY event_id, position
      `)
      .all(...ids);
    for (const r of tkRows) {
      if (!ticketsByEvent.has(r.event_id)) ticketsByEvent.set(r.event_id, []);
      ticketsByEvent.get(r.event_id).push({
        id: r.id, name: r.name,
        badge: r.badge, featured: r.featured === 1,
        price_cents: r.price_cents,
        perks: safeJson(r.perks_json),
      });
    }
  }

  for (const e of events) {
    e.is_main = e.is_main === 1;
    e.timeline = timelineByEvent.get(e.id) || [];
    e.speakers = speakersByEvent.get(e.id) || [];
    e.tickets  = ticketsByEvent.get(e.id)  || [];
  }

  res.json({ events });
});

// Member: ein einzelnes Event (oeffentlich ODER nur-Mitglieder) fuer die
// Landingpage eines eingeloggten Mitglieds. Muss nach /public/:id stehen.
router.get("/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "invalid_id" });

  const ev = loadLandingEvent(id);
  if (!ev) return res.status(404).json({ error: "not_found" });
  delete ev.visibility;
  res.json({ event: ev });
});

export default router;
