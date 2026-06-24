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

// Member: alle Events mit nested timeline + speakers
router.get("/", requireAuth, (_req, res) => {
  const events = db
    .prepare(`
      SELECT id, title, starts_at, location, status,
             fee_cents, max_attendees, description,
             created_at, updated_at
      FROM events
      ORDER BY starts_at ASC
    `)
    .all();

  const timelineByEvent = new Map();
  const speakersByEvent = new Map();

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
  }

  for (const e of events) {
    e.timeline = timelineByEvent.get(e.id) || [];
    e.speakers = speakersByEvent.get(e.id) || [];
  }

  res.json({ events });
});

export default router;
