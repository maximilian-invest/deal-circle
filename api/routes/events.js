import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Public: naechstes upcoming-Event fuer den Landingpage-Banner.
// Keine Auth, nur sichere Felder.
router.get("/public/next", (_req, res) => {
  const row = db
    .prepare(`
      SELECT id, title, starts_at, location, status
      FROM events
      WHERE starts_at >= datetime('now')
        AND status != 'closed'
      ORDER BY starts_at ASC
      LIMIT 1
    `)
    .get();

  res.json({ event: row || null });
});

// Public: ein einzelnes Event fuer die Event-Landingpage mit allen
// Sales-relevanten Feldern (Preis, Programm, Speakers).
router.get("/public/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "invalid_id" });

  const ev = db
    .prepare(`
      SELECT id, title, starts_at, location, status,
             fee_cents, max_attendees, description, cover_path
      FROM events WHERE id = ?
    `)
    .get(id);
  if (!ev) return res.status(404).json({ error: "not_found" });

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
             created_at, updated_at
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
    e.timeline = timelineByEvent.get(e.id) || [];
    e.speakers = speakersByEvent.get(e.id) || [];
    e.tickets  = ticketsByEvent.get(e.id)  || [];
  }

  res.json({ events });
});

export default router;
