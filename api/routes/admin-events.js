import { Router } from "express";
import { z } from "zod";
import db from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);

const eventSchema = z.object({
  title: z.string().min(1).max(200),
  starts_at: z.string().datetime({ offset: true }),
  time_label: z.string().min(1).max(60),
  location: z.string().min(1).max(200),
  status: z.enum(["open", "limited", "waitlist", "closed"]).default("open"),
  fee_cents: z.number().int().min(0).max(10_000_00).default(38000),
  max_attendees: z.number().int().min(0).max(10000).nullable().optional(),
  confirmed_count: z.number().int().min(0).max(10000).default(0),
  description: z.string().max(2000).nullable().optional(),
  speaker: z.string().max(500).nullable().optional(),
  photo_count: z.number().int().min(0).max(100000).default(0),
});

const partialSchema = eventSchema.partial();

router.post("/", (req, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input", details: parsed.error.flatten() });
  }
  const d = parsed.data;

  const info = db
    .prepare(`
      INSERT INTO events (title, starts_at, time_label, location, status, fee_cents,
                          max_attendees, confirmed_count, description, speaker, photo_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      d.title, d.starts_at, d.time_label, d.location, d.status, d.fee_cents,
      d.max_attendees ?? null, d.confirmed_count, d.description ?? null,
      d.speaker ?? null, d.photo_count
    );

  const row = db.prepare("SELECT * FROM events WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json({ event: row });
});

router.patch("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "invalid_id" });

  const existing = db.prepare("SELECT id FROM events WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "not_found" });

  const parsed = partialSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input", details: parsed.error.flatten() });
  }

  const fields = parsed.data;
  const cols = Object.keys(fields);
  if (cols.length === 0) return res.status(400).json({ error: "nothing_to_update" });

  const sets = cols.map((c) => `${c} = ?`).join(", ");
  const values = cols.map((c) => fields[c] === undefined ? null : fields[c]);

  db.prepare(`UPDATE events SET ${sets}, updated_at = datetime('now') WHERE id = ?`)
    .run(...values, id);

  const row = db.prepare("SELECT * FROM events WHERE id = ?").get(id);
  res.json({ event: row });
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "invalid_id" });

  const existing = db.prepare("SELECT id FROM events WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "not_found" });

  db.prepare("DELETE FROM events WHERE id = ?").run(id);
  res.json({ ok: true });
});

export default router;
