import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import db from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { sendMailAsync } from "../lib/mailer.js";
import { membershipApplicationReceived } from "../lib/templates/membership-application.js";
import { membershipAccepted } from "../lib/templates/membership-accepted.js";

const NOTIFY_TO = process.env.DC_NOTIFY_TO || "event@deal-circle.at";
const SITE_URL = process.env.DC_SITE_URL || "https://deal-circle.at";

const router = Router();

// Public: Aufnahme-Antrag absenden — Rate-Limit gegen Spam.
const applyLimiter = rateLimit({
  windowMs: 60_000, max: 5,
  standardHeaders: true, legacyHeaders: false,
  message: { error: "too_many_attempts" },
});

const applicationSchema = z.object({
  name: z.string().min(1).max(160).trim(),
  email: z.string().email().max(200).trim().toLowerCase(),
  phone: z.string().min(4).max(40).trim(),
  street: z.string().min(2).max(200).trim(),
  zip: z.string().min(2).max(20).trim(),
  city: z.string().min(2).max(120).trim(),
  country: z.string().min(2).max(80).trim(),
  company: z.string().min(1).max(160).trim(),
  website: z.string().max(200).trim().optional(),
  role: z.string().max(40).trim().optional(),
  about: z.string().min(20).max(4000).trim(),
  referral: z.string().max(160).trim().optional(),
});

router.post("/", applyLimiter, (req, res) => {
  const parsed = applicationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input", details: parsed.error.flatten() });
  }
  const d = parsed.data;
  const firstName = d.name.trim().split(/\s+/)[0] || "";

  db.prepare(`
    INSERT INTO membership_applications
      (name, email, phone, street, postal_code, city, country, company, website, role, about, referral)
    VALUES (@name, @email, @phone, @street, @zip, @city, @country, @company, @website, @role, @about, @referral)
  `).run({
    name: d.name, email: d.email, phone: d.phone,
    street: d.street, zip: d.zip, city: d.city, country: d.country,
    company: d.company, website: d.website || null, role: d.role || null,
    about: d.about, referral: d.referral || null,
  });

  // Mail 1/2: Bestätigung an den Antragsteller ("wir prüfen deine Anmeldung jetzt")
  const received = membershipApplicationReceived({ firstName });
  sendMailAsync({ to: d.email, subject: received.subject, text: received.text, html: received.html });

  // Mail 2/2: Admin-Notify (fire-and-forget)
  const ts = new Date().toLocaleString("de-AT", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
  sendMailAsync({
    to: NOTIFY_TO,
    replyTo: d.email,
    subject: `Neuer Aufnahme-Antrag: ${d.name}`,
    text:
`Neuer Aufnahme-Antrag über ${SITE_URL}/mitglied-werden/

Name:        ${d.name}
E-Mail:      ${d.email}
Telefon:     ${d.phone}
Adresse:     ${d.street}, ${d.zip} ${d.city}, ${d.country}
Unternehmen: ${d.company}${d.website ? " (" + d.website + ")" : ""}
Rolle:       ${d.role || "—"}
Empfohlen:   ${d.referral || "—"}
Eingelangt:  ${ts}

Über sich:
${d.about}

Prüfen & annehmen im Admin-Bereich → "Offene Anträge".

— DealCircle System`,
  });

  res.status(201).json({ ok: true });
});

// --- Admin: Anträge einsehen (Default: nur offene) ---
router.get("/", requireAuth, requireAdmin, (req, res) => {
  const requested = typeof req.query.status === "string" ? req.query.status : "pending";
  const allowed = ["pending", "accepted", "rejected", "all"];
  const filter = allowed.includes(requested) ? requested : "pending";
  const rows = filter === "all"
    ? db.prepare("SELECT * FROM membership_applications ORDER BY created_at DESC").all()
    : db.prepare("SELECT * FROM membership_applications WHERE status = ? ORDER BY created_at DESC").all(filter);
  const pending = db.prepare("SELECT COUNT(*) AS n FROM membership_applications WHERE status = 'pending'").get().n;
  res.json({ applications: rows, pending_count: pending });
});

// --- Admin: Antrag annehmen → Mitglied anlegen + Einladung mailen ---
router.post("/:id/accept", requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "invalid_id" });
  const application = db.prepare("SELECT * FROM membership_applications WHERE id = ?").get(id);
  if (!application) return res.status(404).json({ error: "not_found" });
  if (application.status === "accepted") return res.json({ ok: true, already: true });

  const firstName = (application.name || "").trim().split(/\s+/)[0] || "";

  const tx = db.transaction(() => {
    let user = db.prepare("SELECT id FROM users WHERE email = ?").get(application.email);
    if (!user) {
      // Zufalls-Passwort — das Mitglied setzt es selbst über den Link in der Mail.
      const randomPw = randomBytes(24).toString("hex");
      const hash = bcrypt.hashSync(randomPw, 11);
      const info = db.prepare(`
        INSERT INTO users (email, name, password_hash, role, phone, company, address, postal_code, city)
        VALUES (?, ?, ?, 'member', ?, ?, ?, ?, ?)
      `).run(application.email, application.name, hash, application.phone,
             application.company, application.street, application.postal_code, application.city);
      user = { id: info.lastInsertRowid };
    }
    // Set-Passwort-Token (7 Tage) — reuse password_resets-Flow.
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60_000).toISOString();
    db.prepare("INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, ?)")
      .run(token, user.id, expires);
    db.prepare(`
      UPDATE membership_applications
      SET status = 'accepted', reviewed_at = datetime('now'), reviewed_by = ?
      WHERE id = ?
    `).run(req.user.sub, id);
    return token;
  });
  const token = tx();

  const setupUrl = `${SITE_URL}/mitglieder/passwort-zuruecksetzen/?token=${token}`;
  const mail = membershipAccepted({ firstName, setupUrl });
  sendMailAsync({ to: application.email, subject: mail.subject, text: mail.text, html: mail.html });

  res.json({ ok: true });
});

// --- Admin: Antrag ablehnen ---
router.post("/:id/reject", requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "invalid_id" });
  const application = db.prepare("SELECT id FROM membership_applications WHERE id = ?").get(id);
  if (!application) return res.status(404).json({ error: "not_found" });
  const note = typeof req.body?.note === "string" ? req.body.note.slice(0, 500) : null;
  db.prepare(`
    UPDATE membership_applications
    SET status = 'rejected', reviewed_at = datetime('now'), reviewed_by = ?, note = COALESCE(?, note)
    WHERE id = ?
  `).run(req.user.sub, note, id);
  res.json({ ok: true });
});

export default router;
