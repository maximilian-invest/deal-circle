import { Router } from "express";
import { z } from "zod";
import db from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);

// ---------- Schemas ----------
const timelineItemSchema = z.object({
  time_label: z.string().min(1).max(40),
  label: z.string().min(1).max(200),
});

const speakerSchema = z.object({
  name: z.string().min(1).max(120),
  bio: z.string().max(2000).nullable().optional().default(null),
  photo_path: z.string().max(500).nullable().optional().default(null),
});

const eventCreateSchema = z.object({
  title: z.string().min(1).max(200),
  starts_at: z.string().datetime({ offset: true }),
  location: z.string().min(1).max(200),
  status: z.enum(["open", "limited", "waitlist", "closed"]).default("open"),
  fee_cents: z.number().int().min(0).max(10_000_00).default(38000),
  max_attendees: z.number().int().min(0).max(10000).nullable().optional().default(null),
  description: z.string().max(2000).nullable().optional().default(null),
  timeline: z.array(timelineItemSchema).max(50).optional().default([]),
  speakers: z.array(speakerSchema).max(20).optional().default([]),
});

const eventUpdateSchema = eventCreateSchema.partial();

// ---------- Helpers ----------
function fetchEventFull(id) {
  const ev = db
    .prepare(`
      SELECT id, title, starts_at, location, status, fee_cents,
             max_attendees, description, created_at, updated_at
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
  return ev;
}

const insertTimelineStmt = db.prepare(`
  INSERT INTO event_timeline (event_id, position, time_label, label)
  VALUES (?, ?, ?, ?)
`);
const insertSpeakerStmt = db.prepare(`
  INSERT INTO event_speakers (event_id, position, name, bio, photo_path)
  VALUES (?, ?, ?, ?, ?)
`);
const deleteTimelineStmt = db.prepare("DELETE FROM event_timeline WHERE event_id = ?");
const deleteSpeakersStmt = db.prepare("DELETE FROM event_speakers WHERE event_id = ?");

function replaceTimeline(eventId, items) {
  deleteTimelineStmt.run(eventId);
  items.forEach((item, idx) => insertTimelineStmt.run(eventId, idx, item.time_label, item.label));
}
function replaceSpeakers(eventId, items) {
  deleteSpeakersStmt.run(eventId);
  items.forEach((item, idx) =>
    insertSpeakerStmt.run(eventId, idx, item.name, item.bio ?? null, item.photo_path ?? null)
  );
}

// ---------- Routes ----------

router.post("/", (req, res) => {
  const parsed = eventCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input", details: parsed.error.flatten() });
  }
  const d = parsed.data;

  const tx = db.transaction(() => {
    const info = db
      .prepare(`
        INSERT INTO events (title, starts_at, location, status, fee_cents,
                            max_attendees, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(d.title, d.starts_at, d.location, d.status, d.fee_cents,
           d.max_attendees, d.description);
    replaceTimeline(info.lastInsertRowid, d.timeline);
    replaceSpeakers(info.lastInsertRowid, d.speakers);
    return info.lastInsertRowid;
  });

  const id = tx();
  res.status(201).json({ event: fetchEventFull(id) });
});

router.patch("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "invalid_id" });

  const existing = db.prepare("SELECT id FROM events WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "not_found" });

  const parsed = eventUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input", details: parsed.error.flatten() });
  }
  const d = parsed.data;

  const eventCols = ["title", "starts_at", "location", "status", "fee_cents",
                     "max_attendees", "description"];
  const updates = [];
  const values = [];
  for (const col of eventCols) {
    if (d[col] !== undefined) {
      updates.push(`${col} = ?`);
      values.push(d[col]);
    }
  }

  const tx = db.transaction(() => {
    if (updates.length) {
      values.push(id);
      db.prepare(`UPDATE events SET ${updates.join(", ")}, updated_at = datetime('now') WHERE id = ?`)
        .run(...values);
    }
    if (d.timeline !== undefined) replaceTimeline(id, d.timeline);
    if (d.speakers !== undefined) replaceSpeakers(id, d.speakers);
  });
  tx();

  res.json({ event: fetchEventFull(id) });
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "invalid_id" });

  const existing = db.prepare("SELECT id FROM events WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "not_found" });

  // CASCADE entfernt timeline + speakers
  db.prepare("DELETE FROM events WHERE id = ?").run(id);
  res.json({ ok: true });
});

export default router;
