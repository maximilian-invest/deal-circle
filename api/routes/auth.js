import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import db from "../db.js";
import { signToken } from "../jwt.js";
import { requireAuth } from "../middleware/auth.js";
import { sendMailAsync } from "../lib/mailer.js";
import { passwordReset } from "../lib/templates/password-reset.js";

const router = Router();

// ---------- Limiters ----------
const loginLimiter = rateLimit({
  windowMs: 60_000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { error: "too_many_attempts" },
});
const resetLimiter = rateLimit({
  windowMs: 5 * 60_000, max: 5,
  standardHeaders: true, legacyHeaders: false,
  message: { error: "too_many_attempts" },
});

const SITE_URL = process.env.DC_SITE_URL || "https://deal-circle.at";

// ---------- LOGIN ----------
const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

router.post("/login", loginLimiter, (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });
  const { email, password } = parsed.data;

  const row = db
    .prepare("SELECT id, email, name, password_hash, role FROM users WHERE email = ?")
    .get(email);
  if (!row) return res.status(401).json({ error: "invalid_credentials" });

  if (!bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: "invalid_credentials" });
  }

  db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(row.id);
  const token = signToken({ sub: row.id, email: row.email, name: row.name, role: row.role });
  res.json({ token, user: { email: row.email, name: row.name, role: row.role } });
});

// ---------- /ME (lightweight, used by NextEvent fetchMe) ----------
router.get("/me", requireAuth, (req, res) => {
  const row = db
    .prepare("SELECT email, name, role, created_at, last_login_at FROM users WHERE id = ?")
    .get(req.user.sub);
  if (!row) return res.status(401).json({ error: "user_gone" });
  res.json({ user: row });
});

// ---------- PROFILE: read + update own ----------
router.get("/me/profile", requireAuth, (req, res) => {
  const row = db.prepare(`
    SELECT id, email, name, role, phone, company, address, postal_code, city, created_at, last_login_at
    FROM users WHERE id = ?
  `).get(req.user.sub);
  if (!row) return res.status(401).json({ error: "user_gone" });
  res.json({ profile: row });
});

const profileUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z.string().max(40).nullable().optional(),
  company: z.string().max(160).nullable().optional(),
  address: z.string().max(200).nullable().optional(),
  postal_code: z.string().max(20).nullable().optional(),
  city: z.string().max(120).nullable().optional(),
});

router.patch("/me/profile", requireAuth, (req, res) => {
  const parsed = profileUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input", details: parsed.error.flatten() });
  }
  const d = parsed.data;
  const updates = [], values = [];
  for (const k of ["name", "phone", "company", "address", "postal_code", "city"]) {
    if (d[k] !== undefined) { updates.push(`${k} = ?`); values.push(d[k]); }
  }
  if (updates.length === 0) return res.status(400).json({ error: "nothing_to_update" });
  values.push(req.user.sub);
  db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...values);

  const row = db.prepare(`
    SELECT id, email, name, role, phone, company, address, postal_code, city, created_at, last_login_at
    FROM users WHERE id = ?
  `).get(req.user.sub);
  res.json({ profile: row });
});

// ---------- PASSWORD CHANGE (logged-in user) ----------
const passwordChangeSchema = z.object({
  current_password: z.string().min(1).max(200),
  new_password: z.string().min(8).max(200),
});

router.post("/me/password", requireAuth, (req, res) => {
  const parsed = passwordChangeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });

  const row = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(req.user.sub);
  if (!row) return res.status(401).json({ error: "user_gone" });
  if (!bcrypt.compareSync(parsed.data.current_password, row.password_hash)) {
    return res.status(401).json({ error: "invalid_credentials" });
  }
  const hash = bcrypt.hashSync(parsed.data.new_password, 11);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, req.user.sub);
  res.json({ ok: true });
});

// ---------- REGISTER (public — VIP-Page Mitgliedsanmeldung) ----------
const registerSchema = z.object({
  first_name: z.string().min(1).max(80).trim(),
  last_name: z.string().min(1).max(80).trim(),
  email: z.string().email().max(200).trim().toLowerCase(),
  phone: z.string().min(4).max(40).trim(),
  company: z.string().max(160).nullable().optional(),
  address: z.string().min(2).max(200).trim(),
  postal_code: z.string().min(2).max(20).trim(),
  city: z.string().min(2).max(120).trim(),
  password: z.string().min(8).max(200),
  consent: z.boolean().refine((v) => v === true, "consent_required"),
});

router.post("/register", loginLimiter, (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input", details: parsed.error.flatten() });
  }
  const d = parsed.data;
  const fullName = `${d.first_name} ${d.last_name}`.trim();

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(d.email);
  if (existing) return res.status(409).json({ error: "email_taken" });

  const hash = bcrypt.hashSync(d.password, 11);
  const info = db.prepare(`
    INSERT INTO users (email, name, password_hash, role, phone, company, address, postal_code, city)
    VALUES (?, ?, ?, 'member', ?, ?, ?, ?, ?)
  `).run(d.email, fullName, hash, d.phone, d.company ?? null, d.address, d.postal_code, d.city);

  // Auto-login: token zurück, so kann VIP-Modal direkt weiterleiten
  const userId = info.lastInsertRowid;
  db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(userId);
  const token = signToken({ sub: userId, email: d.email, name: fullName, role: "member" });

  res.status(201).json({
    ok: true,
    token,
    user: { email: d.email, name: fullName, role: "member" },
  });
});

// ---------- PASSWORD RESET: request mail ----------
const resetRequestSchema = z.object({
  email: z.string().email().max(200).trim().toLowerCase(),
});

router.post("/password-reset/request", resetLimiter, (req, res) => {
  const parsed = resetRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });

  // Immer success zurueck — keine User-Existenz-Leak
  const user = db.prepare("SELECT id, email, name FROM users WHERE email = ?")
                 .get(parsed.data.email);
  if (user) {
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60_000).toISOString();   // 60min
    db.prepare(`
      INSERT INTO password_resets (token, user_id, expires_at)
      VALUES (?, ?, ?)
    `).run(token, user.id, expires);

    const link = `${SITE_URL}/mitglieder/passwort-zuruecksetzen/?token=${token}`;
    const mail = passwordReset({ firstName: user.name.split(/\s+/)[0] || "", link });
    sendMailAsync({ to: user.email, subject: mail.subject, text: mail.text, html: mail.html });
  } else {
    console.log(`[auth] reset-request fuer unbekannte email: ${parsed.data.email}`);
  }

  res.json({ ok: true });
});

// ---------- PASSWORD RESET: confirm with token + new password ----------
const resetConfirmSchema = z.object({
  token: z.string().min(40).max(200),
  new_password: z.string().min(8).max(200),
});

router.post("/password-reset/confirm", resetLimiter, (req, res) => {
  const parsed = resetConfirmSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });

  const row = db.prepare(`
    SELECT user_id, expires_at, used_at FROM password_resets WHERE token = ?
  `).get(parsed.data.token);
  if (!row) return res.status(400).json({ error: "invalid_token" });
  if (row.used_at) return res.status(400).json({ error: "token_used" });
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return res.status(400).json({ error: "token_expired" });
  }

  const hash = bcrypt.hashSync(parsed.data.new_password, 11);
  const tx = db.transaction(() => {
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, row.user_id);
    db.prepare("UPDATE password_resets SET used_at = datetime('now') WHERE token = ?")
      .run(parsed.data.token);
    // Cleanup: alle anderen Tokens dieses Users invalidieren
    db.prepare("UPDATE password_resets SET used_at = datetime('now') WHERE user_id = ? AND used_at IS NULL")
      .run(row.user_id);
  });
  tx();

  res.json({ ok: true });
});

// ---------- LOGOUT ----------
router.post("/logout", (_req, res) => res.json({ ok: true }));

export default router;
