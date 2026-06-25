import { Router } from "express";
import { z } from "zod";
import db from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { sendMailAsync } from "../lib/mailer.js";
import { eventAnnouncement } from "../lib/templates/event-announcement.js";
import { eventLimited } from "../lib/templates/event-limited.js";
import { eventSoldout } from "../lib/templates/event-soldout.js";

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

const ticketSchema = z.object({
  name: z.string().min(1).max(120),
  badge: z.string().max(60).nullable().optional().default(null),
  featured: z.boolean().default(false),
  price_cents: z.number().int().min(0).max(10_000_00),
  perks: z.array(z.string().min(1).max(200)).max(20).default([]),
});

const eventCreateSchema = z.object({
  title: z.string().min(1).max(200),
  starts_at: z.string().datetime({ offset: true }),
  location: z.string().min(1).max(200),
  status: z.enum(["open", "limited", "waitlist", "closed"]).default("open"),
  fee_cents: z.number().int().min(0).max(10_000_00).default(38000),
  max_attendees: z.number().int().min(0).max(10000).nullable().optional().default(null),
  description: z.string().max(2000).nullable().optional().default(null),
  cover_path: z.string().max(500).nullable().optional().default(null),
  is_main: z.boolean().default(false),
  visibility: z.enum(["public", "members"]).default("public"),
  member_discount_pct: z.number().int().min(0).max(90).default(0),
  timeline: z.array(timelineItemSchema).max(50).optional().default([]),
  speakers: z.array(speakerSchema).max(20).optional().default([]),
  tickets:  z.array(ticketSchema).max(10).optional().default([]),
});

const eventUpdateSchema = eventCreateSchema.partial();

// ---------- Helpers ----------
function fetchEventFull(id) {
  const ev = db
    .prepare(`
      SELECT id, title, starts_at, location, status, fee_cents,
             max_attendees, description, cover_path, is_main, visibility,
             member_discount_pct, created_at, updated_at
      FROM events WHERE id = ?
    `)
    .get(id);
  if (!ev) return null;
  ev.is_main = ev.is_main === 1;
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
      perks: safeParseJson(t.perks_json, []),
    }));
  return ev;
}

function safeParseJson(s, fallback) {
  try { const v = JSON.parse(s); return Array.isArray(v) ? v : fallback; }
  catch { return fallback; }
}

const insertTimelineStmt = db.prepare(`
  INSERT INTO event_timeline (event_id, position, time_label, label)
  VALUES (?, ?, ?, ?)
`);
const insertSpeakerStmt = db.prepare(`
  INSERT INTO event_speakers (event_id, position, name, bio, photo_path)
  VALUES (?, ?, ?, ?, ?)
`);
const insertTicketStmt = db.prepare(`
  INSERT INTO event_tickets (event_id, position, name, badge, featured, price_cents, perks_json)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const deleteTimelineStmt = db.prepare("DELETE FROM event_timeline WHERE event_id = ?");
const deleteSpeakersStmt = db.prepare("DELETE FROM event_speakers WHERE event_id = ?");
const deleteTicketsStmt  = db.prepare("DELETE FROM event_tickets  WHERE event_id = ?");

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
function replaceTickets(eventId, items) {
  deleteTicketsStmt.run(eventId);
  items.forEach((item, idx) =>
    insertTicketStmt.run(
      eventId, idx, item.name,
      item.badge ?? null,
      item.featured ? 1 : 0,
      item.price_cents,
      JSON.stringify(item.perks || [])
    )
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
                            max_attendees, description, cover_path, is_main, visibility,
                            member_discount_pct)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(d.title, d.starts_at, d.location, d.status, d.fee_cents,
           d.max_attendees, d.description, d.cover_path, d.is_main ? 1 : 0, d.visibility,
           d.member_discount_pct);
    replaceTimeline(info.lastInsertRowid, d.timeline);
    replaceSpeakers(info.lastInsertRowid, d.speakers);
    replaceTickets(info.lastInsertRowid, d.tickets);
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
                     "max_attendees", "description", "cover_path", "visibility",
                     "member_discount_pct"];
  const updates = [];
  const values = [];
  for (const col of eventCols) {
    if (d[col] !== undefined) {
      updates.push(`${col} = ?`);
      values.push(d[col]);
    }
  }
  if (d.is_main !== undefined) {
    updates.push("is_main = ?");
    values.push(d.is_main ? 1 : 0);
  }

  const tx = db.transaction(() => {
    if (updates.length) {
      values.push(id);
      db.prepare(`UPDATE events SET ${updates.join(", ")}, updated_at = datetime('now') WHERE id = ?`)
        .run(...values);
    }
    if (d.timeline !== undefined) replaceTimeline(id, d.timeline);
    if (d.speakers !== undefined) replaceSpeakers(id, d.speakers);
    if (d.tickets  !== undefined) replaceTickets(id, d.tickets);
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

// ---------- ADMIN: Anmeldungen pro Event ----------
router.get("/:id/registrations", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "invalid_id" });

  const rows = db.prepare(`
    SELECT r.id, r.status, r.amount_cents, r.created_at, r.paid_at, r.note,
           u.id AS user_id, u.name, u.email, u.phone, u.company,
           t.id AS ticket_id, t.name AS ticket_name
    FROM event_registrations r
    JOIN users u ON u.id = r.user_id
    LEFT JOIN event_tickets t ON t.id = r.ticket_id
    WHERE r.event_id = ?
    ORDER BY r.created_at DESC
  `).all(id);

  const guests = db.prepare(`
    SELECT g.id, g.status, g.amount_cents, g.created_at, g.paid_at,
           g.name, g.email, t.id AS ticket_id, t.name AS ticket_name
    FROM event_guest_registrations g
    LEFT JOIN event_tickets t ON t.id = g.ticket_id
    WHERE g.event_id = ?
    ORDER BY g.created_at DESC
  `).all(id);

  res.json({ registrations: rows, guests });
});

// Admin kann Status / Note einer Registrierung aendern
const regUpdateSchema = z.object({
  status: z.enum(["reserved","paid","waitlist","cancelled"]).optional(),
  note:   z.string().max(500).nullable().optional(),
});
router.patch("/:eventId/registrations/:regId", (req, res) => {
  const eventId = Number(req.params.eventId);
  const regId = Number(req.params.regId);
  if (!Number.isInteger(eventId) || eventId < 1) return res.status(400).json({ error: "invalid_id" });
  if (!Number.isInteger(regId) || regId < 1) return res.status(400).json({ error: "invalid_id" });

  const parsed = regUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });

  const updates = [], values = [];
  if (parsed.data.status !== undefined) {
    updates.push("status = ?"); values.push(parsed.data.status);
    if (parsed.data.status === "paid") updates.push("paid_at = datetime('now')");
  }
  if (parsed.data.note !== undefined) {
    updates.push("note = ?"); values.push(parsed.data.note);
  }
  if (!updates.length) return res.status(400).json({ error: "nothing_to_update" });
  values.push(regId, eventId);
  db.prepare(`UPDATE event_registrations SET ${updates.join(", ")}
              WHERE id = ? AND event_id = ?`).run(...values);
  res.json({ ok: true });
});

// ---------- ADMIN: Mail an Mitglieder ----------
// Lieferanzahl + Verlauf (UI zeigt das, bevor gesendet wird)
router.get("/:id/mail-stats", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "invalid_id" });

  const memberCount = db.prepare(
    "SELECT COUNT(*) AS n FROM users WHERE role = 'member'"
  ).get().n;
  const registeredCount = db.prepare(
    "SELECT COUNT(*) AS n FROM event_registrations WHERE event_id = ? AND status != 'cancelled'"
  ).get(id).n;
  const history = db.prepare(`
    SELECT s.id, s.kind, s.recipient_count, s.created_at,
           u.name AS triggered_by_name
    FROM event_mail_sends s
    LEFT JOIN users u ON u.id = s.triggered_by_user_id
    WHERE s.event_id = ?
    ORDER BY s.created_at DESC
    LIMIT 20
  `).all(id);

  res.json({
    member_count: memberCount,
    registered_count: registeredCount,
    history,
  });
});

const mailSendSchema = z.object({
  kind: z.enum(["announcement","limited","soldout"]),
  exclude_registered: z.boolean().default(false),
  test_to_self: z.boolean().default(false),
});

const TEMPLATE_MAP = {
  announcement: { fn: eventAnnouncement, label: "Anmeldung möglich" },
  limited:      { fn: eventLimited,      label: "Wenige Plätze" },
  soldout:      { fn: eventSoldout,      label: "Ausgebucht" },
};

router.post("/:id/mail", (req, res) => {
  const eventId = Number(req.params.id);
  if (!Number.isInteger(eventId) || eventId < 1) return res.status(400).json({ error: "invalid_id" });

  const parsed = mailSendSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });
  const { kind, exclude_registered, test_to_self } = parsed.data;

  const event = fetchEventFull(eventId);
  if (!event) return res.status(404).json({ error: "not_found" });

  // Empfaengerliste bauen
  let recipients;
  if (test_to_self) {
    const me = db.prepare("SELECT email, name FROM users WHERE id = ?").get(req.user.sub);
    recipients = me ? [me] : [];
  } else if (exclude_registered) {
    recipients = db.prepare(`
      SELECT u.email, u.name FROM users u
      WHERE u.role = 'member'
        AND NOT EXISTS (
          SELECT 1 FROM event_registrations r
          WHERE r.event_id = ? AND r.user_id = u.id AND r.status != 'cancelled'
        )
    `).all(eventId);
  } else {
    recipients = db.prepare(
      "SELECT email, name FROM users WHERE role = 'member'"
    ).all();
  }

  const tpl = TEMPLATE_MAP[kind];
  if (!tpl) return res.status(400).json({ error: "invalid_kind" });

  for (const r of recipients) {
    const firstName = (r.name || "").split(/\s+/)[0] || "";
    const mail = tpl.fn({ event, firstName });
    sendMailAsync({
      to: r.email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
  }

  // Log-Entry (nur bei realem Send, nicht bei Test)
  if (!test_to_self) {
    db.prepare(`
      INSERT INTO event_mail_sends (event_id, kind, triggered_by_user_id, recipient_count)
      VALUES (?, ?, ?, ?)
    `).run(eventId, kind, req.user.sub, recipients.length);
  }

  res.json({
    ok: true,
    kind,
    label: tpl.label,
    recipient_count: recipients.length,
    test: test_to_self,
  });
});

export default router;
