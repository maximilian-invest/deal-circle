import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import db from "../db.js";
import { signToken } from "../jwt.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_attempts" },
});

const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

router.post("/login", loginLimiter, (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input" });
  }
  const { email, password } = parsed.data;

  const row = db
    .prepare("SELECT id, email, name, password_hash, role FROM users WHERE email = ?")
    .get(email);

  if (!row) {
    return res.status(401).json({ error: "invalid_credentials" });
  }

  const ok = bcrypt.compareSync(password, row.password_hash);
  if (!ok) {
    return res.status(401).json({ error: "invalid_credentials" });
  }

  db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(row.id);

  const token = signToken({ sub: row.id, email: row.email, name: row.name, role: row.role });

  res.json({
    token,
    user: { email: row.email, name: row.name, role: row.role },
  });
});

router.get("/me", requireAuth, (req, res) => {
  const row = db
    .prepare("SELECT email, name, role, created_at, last_login_at FROM users WHERE id = ?")
    .get(req.user.sub);

  if (!row) {
    return res.status(401).json({ error: "user_gone" });
  }

  res.json({ user: row });
});

router.post("/logout", (req, res) => {
  res.json({ ok: true });
});

export default router;
