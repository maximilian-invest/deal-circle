import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import db from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/users", (_req, res) => {
  const rows = db
    .prepare("SELECT id, email, name, role, phone, company, created_at, last_login_at FROM users ORDER BY created_at DESC")
    .all();
  res.json({ users: rows });
});

const createSchema = z.object({
  email: z.string().email().max(200),
  name: z.string().min(1).max(120),
  password: z.string().min(8).max(200),
  role: z.enum(["admin", "member"]).default("member"),
});

router.post("/users", (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input", details: parsed.error.flatten() });
  }
  const { email, name, password, role } = parsed.data;

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return res.status(409).json({ error: "email_taken" });
  }

  const hash = bcrypt.hashSync(password, 11);
  const info = db
    .prepare("INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)")
    .run(email, name, hash, role);

  const row = db
    .prepare("SELECT id, email, name, role, phone, company, created_at FROM users WHERE id = ?")
    .get(info.lastInsertRowid);

  res.status(201).json({ user: row });
});

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  password: z.string().min(8).max(200).optional(),
  role: z.enum(["admin", "member"]).optional(),
});

router.patch("/users/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "invalid_id" });
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input" });
  }

  const existing = db.prepare("SELECT id, role FROM users WHERE id = ?").get(id);
  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }

  const updates = [];
  const values = [];

  if (parsed.data.name !== undefined) {
    updates.push("name = ?");
    values.push(parsed.data.name);
  }
  if (parsed.data.password !== undefined) {
    updates.push("password_hash = ?");
    values.push(bcrypt.hashSync(parsed.data.password, 11));
  }
  if (parsed.data.role !== undefined) {
    if (existing.role === "admin" && parsed.data.role !== "admin") {
      const adminCount = db
        .prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'")
        .get().n;
      if (adminCount <= 1) {
        return res.status(409).json({ error: "last_admin" });
      }
    }
    updates.push("role = ?");
    values.push(parsed.data.role);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: "nothing_to_update" });
  }

  values.push(id);
  db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...values);

  const row = db
    .prepare("SELECT id, email, name, role, phone, company, created_at, last_login_at FROM users WHERE id = ?")
    .get(id);

  res.json({ user: row });
});

router.delete("/users/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "invalid_id" });
  }

  const target = db.prepare("SELECT id, role FROM users WHERE id = ?").get(id);
  if (!target) {
    return res.status(404).json({ error: "not_found" });
  }

  if (target.id === req.user.sub) {
    return res.status(409).json({ error: "self_delete" });
  }

  if (target.role === "admin") {
    const adminCount = db
      .prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'")
      .get().n;
    if (adminCount <= 1) {
      return res.status(409).json({ error: "last_admin" });
    }
  }

  db.prepare("DELETE FROM users WHERE id = ?").run(id);
  res.json({ ok: true });
});

export default router;
