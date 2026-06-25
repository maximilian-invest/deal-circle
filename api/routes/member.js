import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import db from "../db.js";
import { signToken } from "../jwt.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { sendMailAsync } from "../lib/mailer.js";
import { vipWelcome } from "../lib/templates/vip-welcome.js";

const NOTIFY_TO = process.env.DC_NOTIFY_TO || "event@deal-circle.at";

const router = Router();

// Public: VIP-Signup-Endpoint mit Rate-Limit gegen Spam
const signupLimiter = rateLimit({
  windowMs: 60_000, max: 5,
  standardHeaders: true, legacyHeaders: false,
  message: { error: "too_many_attempts" },
});

const signupSchema = z.object({
  first_name: z.string().min(1).max(80).trim(),
  last_name: z.string().min(1).max(80).trim(),
  email: z.string().email().max(200).trim().toLowerCase(),
  phone: z.string().min(4).max(40).trim(),
  company: z.string().max(160).nullable().optional(),
  password: z.string().min(8).max(200),
  consent: z.boolean().refine((v) => v === true, "consent_required"),
});

router.post("/register", signupLimiter, (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input", details: parsed.error.flatten() });
  }
  const d = parsed.data;
  const fullName = `${d.first_name} ${d.last_name}`.trim();

  // Doppelte E-Mail → kein User-Existenz-Leak, aber klare Antwort
  const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(d.email);
  if (existingUser) {
    return res.status(409).json({ error: "email_taken" });
  }

  const passwordHash = bcrypt.hashSync(d.password, 11);
  const tx = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO users (email, name, password_hash, role, phone, company, last_login_at)
      VALUES (?, ?, ?, 'member', ?, ?, datetime('now'))
    `).run(d.email, fullName, passwordHash, d.phone, d.company ?? null);

    // Audit-Trail
    db.prepare(`
      INSERT INTO vip_signups (first_name, last_name, email, phone, company, consent_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(d.first_name, d.last_name, d.email, d.phone, d.company ?? null);

    return info.lastInsertRowid;
  });
  const userId = tx();

  // Auto-Login: token zurueck damit Frontend direkt in den Mitgliederbereich
  const token = signToken({
    sub: userId, email: d.email, name: fullName, role: "member",
  });

  // --- Mail 1/2: Admin-Notify (fire-and-forget) ---
  const ts = new Date().toLocaleString("de-AT", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  sendMailAsync({
    to: NOTIFY_TO,
    replyTo: d.email,
    subject: `Neue Anmeldung: ${fullName}`,
    text:
`Neue Anmeldung über https://deal-circle.at/member/

Name:        ${fullName}
E-Mail:      ${d.email}
Telefon:     ${d.phone}
Unternehmen: ${d.company || "—"}
Eingelangt:  ${ts}

Der Account wurde automatisch angelegt und ist eingeloggt. Du siehst
ihn jetzt im Admin-Tab "Mitglieder verwalten".

Antworten landet direkt beim Mitglied (Reply-To gesetzt).

— DealCircle System`,
  });

  // --- Mail 2/2: Customer-Confirm (HTML + Plaintext-Fallback) ---
  const welcome = vipWelcome({ firstName: d.first_name });
  sendMailAsync({
    to: d.email,
    subject: welcome.subject,
    text: welcome.text,
    html: welcome.html,
  });

  res.status(201).json({
    ok: true,
    token,
    user: { email: d.email, name: fullName, role: "member" },
  });
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
