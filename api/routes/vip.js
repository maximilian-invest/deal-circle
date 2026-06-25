import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import db from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// Public: VIP-Signup-Endpoint mit Rate-Limit gegen Spam
const signupLimiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_attempts" },
});

const signupSchema = z.object({
  first_name: z.string().min(1).max(80).trim(),
  last_name: z.string().min(1).max(80).trim(),
  email: z.string().email().max(200).trim().toLowerCase(),
  phone: z.string().min(4).max(40).trim(),
  company: z.string().max(160).nullable().optional(),
  consent: z.boolean().refine((v) => v === true, "consent_required"),
});

router.post("/register", signupLimiter, (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input", details: parsed.error.flatten() });
  }
  const d = parsed.data;

  // Idempotent: gleiche E-Mail wird nicht doppelt eingetragen, aber als
  // success retourniert (frontend soll nichts leaken). Optional: counter.
  const existing = db
    .prepare("SELECT id FROM vip_signups WHERE email = ? COLLATE NOCASE")
    .get(d.email);

  if (existing) {
    return res.status(200).json({ ok: true, dedupe: true });
  }

  db.prepare(
    `INSERT INTO vip_signups (first_name, last_name, email, phone, company, consent_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`
  ).run(d.first_name, d.last_name, d.email, d.phone, d.company ?? null);

  res.status(201).json({ ok: true });
});

// --- Admin: Signups einsehen + als "verarbeitet" markieren ---
router.get("/admin/signups", requireAuth, requireAdmin, (_req, res) => {
  const rows = db
    .prepare(`
      SELECT id, first_name, last_name, email, phone, company,
             consent_at, created_at, processed_at, note
      FROM vip_signups
      ORDER BY created_at DESC
    `)
    .all();
  res.json({ signups: rows });
});

router.patch("/admin/signups/:id", requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "invalid_id" });
  const existing = db.prepare("SELECT id FROM vip_signups WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "not_found" });

  const note = typeof req.body?.note === "string" ? req.body.note.slice(0, 500) : null;
  const processed = req.body?.processed === true;

  db.prepare(
    `UPDATE vip_signups
     SET note = COALESCE(?, note),
         processed_at = CASE WHEN ? THEN datetime('now') ELSE processed_at END
     WHERE id = ?`
  ).run(note, processed ? 1 : 0, id);

  res.json({ ok: true });
});

router.delete("/admin/signups/:id", requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "invalid_id" });
  db.prepare("DELETE FROM vip_signups WHERE id = ?").run(id);
  res.json({ ok: true });
});

export default router;
