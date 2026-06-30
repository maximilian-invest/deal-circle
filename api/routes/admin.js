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

// ---------- Finanzen / Einnahmen-Dashboard ----------
// Echte Umsätze je Event aus bezahlten Anmeldungen (Mitglieder + Gäste).
// Standard/VIP-Split: VIP = als Highlight markierte Ticket-Kategorie (featured).
// Beträge = tatsächlich kassierte Summe (amount_total_cents, inkl. MwSt).
router.get("/finance", (_req, res) => {
  const events = db.prepare(`
    SELECT id, title, starts_at, location, status
    FROM events ORDER BY starts_at DESC
  `).all();

  const memberRows = db.prepare(`
    SELECT r.event_id,
           COALESCE(r.amount_total_cents, r.amount_cents, 0) AS amount_cents,
           r.paid_at, u.name AS payer_name, u.company AS payer_company,
           t.name AS ticket_name, t.featured AS ticket_featured
    FROM event_registrations r
    JOIN users u ON u.id = r.user_id
    LEFT JOIN event_tickets t ON t.id = r.ticket_id
    WHERE r.status = 'paid'
  `).all();

  const guestRows = db.prepare(`
    SELECT g.event_id,
           COALESCE(g.amount_total_cents, g.amount_cents, 0) AS amount_cents,
           g.paid_at, g.name AS payer_name,
           t.name AS ticket_name, t.featured AS ticket_featured
    FROM event_guest_registrations g
    LEFT JOIN event_tickets t ON t.id = g.ticket_id
    WHERE g.status = 'paid'
  `).all();

  const byEvent = new Map();
  const addPayer = (r, isGuest) => {
    if (!byEvent.has(r.event_id)) byEvent.set(r.event_id, []);
    byEvent.get(r.event_id).push({
      name: r.payer_name || (isGuest ? "Gast" : "—"),
      company: isGuest ? null : (r.payer_company || null),
      ticket: r.ticket_name || "Teilnahme",
      vip: r.ticket_featured === 1,
      price_cents: r.amount_cents || 0,
      paid_at: r.paid_at || null,
      method: "Kreditkarte",
      kind: isGuest ? "guest" : "member",
    });
  };
  for (const r of memberRows) addPayer(r, false);
  for (const r of guestRows) addPayer(r, true);

  const out = [];
  for (const ev of events) {
    const payers = byEvent.get(ev.id);
    if (!payers || payers.length === 0) continue; // nur Events mit Umsatz zeigen
    payers.sort((a, b) => String(b.paid_at || "").localeCompare(String(a.paid_at || "")));
    let stdRev = 0, vipRev = 0, stdCount = 0, vipCount = 0;
    const catMap = new Map();
    for (const p of payers) {
      if (p.vip) { vipRev += p.price_cents; vipCount++; }
      else       { stdRev += p.price_cents; stdCount++; }
      const key = `${p.ticket}|${p.vip ? 1 : 0}`;
      if (!catMap.has(key)) catMap.set(key, { name: p.ticket, featured: p.vip, count: 0 });
      catMap.get(key).count++;
    }
    out.push({
      id: ev.id, title: ev.title, starts_at: ev.starts_at,
      location: ev.location, status: ev.status,
      revenue_cents: stdRev + vipRev, ticket_count: payers.length,
      std_rev_cents: stdRev, vip_rev_cents: vipRev,
      std_count: stdCount, vip_count: vipCount,
      categories: [...catMap.values()].sort((a, b) => Number(a.featured) - Number(b.featured)),
      payers,
    });
  }

  res.json({ events: out });
});

export default router;
