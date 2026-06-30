import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { getStripe, SITE_URL } from "../lib/stripe.js";

const router = Router();

// Gast-Checkout (öffentlich) gegen Spam absichern.
const guestCheckoutLimiter = rateLimit({
  windowMs: 60_000, max: 8,
  standardHeaders: true, legacyHeaders: false,
  message: { error: "too_many_attempts" },
});

// ---------- MEMBER: meine Anmeldungen ----------
router.get("/me/registrations", requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT r.id, r.event_id, r.ticket_id, r.status, r.amount_cents,
           r.created_at, r.paid_at,
           e.title AS event_title, e.starts_at, e.location,
           t.name AS ticket_name
    FROM event_registrations r
    JOIN events e ON e.id = r.event_id
    LEFT JOIN event_tickets t ON t.id = r.ticket_id
    WHERE r.user_id = ?
    ORDER BY e.starts_at ASC
  `).all(req.user.sub);
  res.json({ registrations: rows });
});

// ---------- MEMBER: anmelden ----------
const registerSchema = z.object({
  ticket_id: z.number().int().min(1).nullable().optional(),
});

router.post("/:id/register", requireAuth, (req, res) => {
  const eventId = Number(req.params.id);
  if (!Number.isInteger(eventId) || eventId < 1) return res.status(400).json({ error: "invalid_id" });

  const parsed = registerSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });
  const ticketId = parsed.data.ticket_id ?? null;

  const event = db.prepare(
    "SELECT id, status, fee_cents, member_discount_pct FROM events WHERE id = ?"
  ).get(eventId);
  if (!event) return res.status(404).json({ error: "not_found" });
  if (event.status === "closed") return res.status(409).json({ error: "event_closed" });

  // Schon bezahlt? → blockieren. Eine offene (reservierte/Warteliste-)Anmeldung
  // wird dagegen weiter unten auf die NEU gewählte Ticket-Stufe aktualisiert,
  // damit ein Ticket-Wechsel vor der Zahlung den richtigen Preis ergibt.
  const existing = db.prepare(
    "SELECT id, status FROM event_registrations WHERE event_id = ? AND user_id = ?"
  ).get(eventId, req.user.sub);
  if (existing && existing.status === "paid") {
    return res.status(409).json({ error: "already_paid", registration_id: existing.id });
  }

  // Ticket-Preis + Rabatt ableiten. Pro Preiskategorie kann ein eigener
  // Mitglieder-Rabatt gesetzt sein; ohne Ticket greift der Event-Rabatt.
  let amountCents = event.fee_cents;
  let pct = event.member_discount_pct || 0;
  if (ticketId) {
    const t = db.prepare(
      "SELECT id, price_cents, member_discount_pct FROM event_tickets WHERE id = ? AND event_id = ?"
    ).get(ticketId, eventId);
    if (!t) return res.status(400).json({ error: "invalid_ticket" });
    amountCents = t.price_cents;
    pct = t.member_discount_pct || 0;
  }

  // Eingeloggte Mitglieder bekommen den Mitglieder-Rabatt der Kategorie.
  if (pct > 0) amountCents = Math.round((amountCents * (100 - pct)) / 100);

  // Status: bei waitlist-Event automatisch auf Warteliste, sonst 'reserved'
  const status = event.status === "waitlist" ? "waitlist" : "reserved";

  let info;
  if (existing) {
    // Bestehende (reservierte/Warteliste-/stornierte) Anmeldung auf die neu
    // gewählte Ticket-Stufe + Preis aktualisieren.
    db.prepare(`
      UPDATE event_registrations
      SET status = ?, ticket_id = ?, amount_cents = ?, created_at = datetime('now')
      WHERE id = ?
    `).run(status, ticketId, amountCents, existing.id);
    info = { lastInsertRowid: existing.id };
  } else {
    info = db.prepare(`
      INSERT INTO event_registrations (event_id, user_id, ticket_id, amount_cents, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(eventId, req.user.sub, ticketId, amountCents, status);
  }

  res.status(201).json({
    ok: true,
    registration: {
      id: info.lastInsertRowid,
      event_id: eventId,
      ticket_id: ticketId,
      status,
      amount_cents: amountCents,
    },
  });
});

// ---------- MEMBER: Stripe Checkout starten ----------
router.post("/:id/checkout", requireAuth, async (req, res) => {
  const eventId = Number(req.params.id);
  if (!Number.isInteger(eventId) || eventId < 1) return res.status(400).json({ error: "invalid_id" });

  // Rueckkehr-Ziel nach der Zahlung: aus dem Mitglieder-Dashboard zurueck ins
  // Dashboard (mit Danke-Pop-up), sonst auf die oeffentliche Danke-Seite.
  const fromDashboard = req.body?.from === "dashboard";
  const paidUrl = `${SITE_URL}/mitglieder/dashboard/?paid=1&event=${eventId}`;
  const successUrl = fromDashboard ? paidUrl : `${SITE_URL}/danke/?id=${eventId}`;
  const cancelUrl  = fromDashboard
    ? `${SITE_URL}/mitglieder/dashboard/?cancelled=1`
    : `${SITE_URL}/event/?id=${eventId}&cancelled=1`;

  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: "payments_disabled" });

  const reg = db.prepare(`
    SELECT r.id, r.status, r.amount_cents, r.ticket_id, r.event_id,
           e.title AS event_title, e.starts_at,
           t.name AS ticket_name, t.badge AS ticket_badge,
           u.email, u.name AS user_name
    FROM event_registrations r
    JOIN events e ON e.id = r.event_id
    LEFT JOIN event_tickets t ON t.id = r.ticket_id
    JOIN users u ON u.id = r.user_id
    WHERE r.event_id = ? AND r.user_id = ?
  `).get(eventId, req.user.sub);

  if (!reg) return res.status(404).json({ error: "no_registration" });
  if (reg.status === "paid")      return res.status(409).json({ error: "already_paid" });
  if (reg.status === "cancelled") return res.status(409).json({ error: "registration_cancelled" });
  if (reg.status === "waitlist")  return res.status(409).json({ error: "on_waitlist" });

  const amountCents = reg.amount_cents ?? 0;
  if (amountCents <= 0) {
    // Gratis-Event — direkt auf paid, ohne Stripe
    db.prepare(`
      UPDATE event_registrations
      SET status = 'paid', paid_at = datetime('now'), amount_total_cents = 0
      WHERE id = ?
    `).run(reg.id);
    return res.json({ ok: true, free: true, redirect: fromDashboard ? paidUrl : `${SITE_URL}/event/?id=${eventId}&paid=1` });
  }

  const ticketLabel = reg.ticket_name
    ? `${reg.ticket_name}${reg.ticket_badge ? ` · ${reg.ticket_badge}` : ""}`
    : "Teilnahme";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "eur",
          unit_amount: amountCents,
          tax_behavior: "exclusive",
          product_data: {
            name: `${reg.event_title} — ${ticketLabel}`,
            description: `Teilnahme · ${new Date(reg.starts_at).toLocaleDateString("de-AT", { day: "2-digit", month: "long", year: "numeric" })}`,
            tax_code: "txcd_20030000", // "Live events / Admissions"
          },
        },
        quantity: 1,
      }],
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `Teilnahme: ${reg.event_title}`,
          metadata: {
            registration_id: String(reg.id),
            event_id: String(eventId),
          },
          rendering_options: { amount_tax_display: "include_inclusive_tax" },
        },
      },
      customer_email: reg.email,
      billing_address_collection: "required",
      allow_promotion_codes: false,
      metadata: {
        registration_id: String(reg.id),
        event_id: String(eventId),
        user_id: String(req.user.sub),
      },
      payment_intent_data: {
        description: `${reg.event_title} (Reg #${reg.id})`,
        metadata: {
          registration_id: String(reg.id),
          event_id: String(eventId),
        },
      },
      success_url: successUrl,
      cancel_url:  cancelUrl,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60,  // 1h Gültigkeit
    });

    db.prepare(`
      UPDATE event_registrations SET stripe_session_id = ? WHERE id = ?
    `).run(session.id, reg.id);

    res.json({ ok: true, checkout_url: session.url, session_id: session.id });
  } catch (err) {
    console.error("[stripe] checkout session create failed:", err);
    res.status(502).json({ error: "stripe_error", detail: err?.message || "unknown" });
  }
});

// ---------- MEMBER: eigene Anmeldung stornieren ----------
router.delete("/:id/register", requireAuth, (req, res) => {
  const eventId = Number(req.params.id);
  if (!Number.isInteger(eventId) || eventId < 1) return res.status(400).json({ error: "invalid_id" });

  db.prepare(`
    UPDATE event_registrations SET status = 'cancelled'
    WHERE event_id = ? AND user_id = ?
  `).run(eventId, req.user.sub);
  res.json({ ok: true });
});

// ---------- PUBLIC (Gast): Ticket ohne Login reservieren ----------
// Nur für öffentliche Events. Gäste zahlen den regulären Preis (kein
// Mitglieder-Rabatt). Name + E-Mail genügen.
const guestRegisterSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  ticket_id: z.number().int().min(1).nullable().optional(),
});

router.post("/:id/register-guest", (req, res) => {
  const eventId = Number(req.params.id);
  if (!Number.isInteger(eventId) || eventId < 1) return res.status(400).json({ error: "invalid_id" });

  const parsed = guestRegisterSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });
  const name = parsed.data.name.trim();
  const email = parsed.data.email.trim();
  const ticketId = parsed.data.ticket_id ?? null;

  const event = db.prepare(
    "SELECT id, status, fee_cents, visibility FROM events WHERE id = ?"
  ).get(eventId);
  if (!event) return res.status(404).json({ error: "not_found" });
  if (event.visibility !== "public") return res.status(403).json({ error: "members_only" });
  if (event.status === "closed") return res.status(409).json({ error: "event_closed" });

  let amountCents = event.fee_cents;
  if (ticketId) {
    const t = db.prepare(
      "SELECT id, price_cents FROM event_tickets WHERE id = ? AND event_id = ?"
    ).get(ticketId, eventId);
    if (!t) return res.status(400).json({ error: "invalid_ticket" });
    amountCents = t.price_cents;
  }

  const existing = db.prepare(
    "SELECT id, status FROM event_guest_registrations WHERE event_id = ? AND email = ?"
  ).get(eventId, email);
  if (existing && existing.status !== "cancelled") {
    return res.status(409).json({ error: "already_registered" });
  }

  let info;
  if (existing) {
    db.prepare(`
      UPDATE event_guest_registrations
      SET status = 'reserved', name = ?, ticket_id = ?, amount_cents = ?, created_at = datetime('now')
      WHERE id = ?
    `).run(name, ticketId, amountCents, existing.id);
    info = { lastInsertRowid: existing.id };
  } else {
    info = db.prepare(`
      INSERT INTO event_guest_registrations (event_id, ticket_id, name, email, amount_cents, status)
      VALUES (?, ?, ?, ?, ?, 'reserved')
    `).run(eventId, ticketId, name, email, amountCents);
  }

  res.status(201).json({
    ok: true,
    registration: {
      id: info.lastInsertRowid,
      event_id: eventId,
      ticket_id: ticketId,
      status: "reserved",
      amount_cents: amountCents,
    },
  });
});

// ---------- PUBLIC (Gast): Ticket ohne Login KAUFEN (Stripe) ----------
// Geht für bezahlte Events DIREKT zu Stripe — Name, E-Mail und Adresse
// werden dort erfasst. Die Gast-Registrierung wird erst vom Webhook nach
// erfolgreicher Zahlung aus den Stripe-Daten angelegt (kein Vorab-Formular).
// Für Gratis-Events (kein Stripe) werden Name + E-Mail im Body erwartet.
const guestCheckoutSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().max(200).optional(),
  ticket_id: z.number().int().min(1).nullable().optional(),
});

router.post("/:id/checkout-guest", guestCheckoutLimiter, async (req, res) => {
  const eventId = Number(req.params.id);
  if (!Number.isInteger(eventId) || eventId < 1) return res.status(400).json({ error: "invalid_id" });

  const parsed = guestCheckoutSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });
  const ticketId = parsed.data.ticket_id ?? null;

  const event = db.prepare(
    "SELECT id, title, starts_at, status, fee_cents, visibility FROM events WHERE id = ?"
  ).get(eventId);
  if (!event) return res.status(404).json({ error: "not_found" });
  if (event.visibility !== "public") return res.status(403).json({ error: "members_only" });
  if (event.status === "closed")   return res.status(409).json({ error: "event_closed" });
  if (event.status === "waitlist") return res.status(409).json({ error: "on_waitlist" });

  let amountCents = event.fee_cents;
  let ticketName = null, ticketBadge = null;
  if (ticketId) {
    const t = db.prepare(
      "SELECT id, name, badge, price_cents FROM event_tickets WHERE id = ? AND event_id = ?"
    ).get(ticketId, eventId);
    if (!t) return res.status(400).json({ error: "invalid_ticket" });
    amountCents = t.price_cents;
    ticketName = t.name; ticketBadge = t.badge;
  }

  // Gratis-Event → kein Stripe; hier brauchen wir Name + E-Mail (aus dem Formular).
  if (amountCents <= 0) {
    const name = parsed.data.name?.trim();
    const email = parsed.data.email?.trim().toLowerCase();
    if (!name || !email) return res.status(400).json({ error: "name_email_required" });

    const existing = db.prepare(
      "SELECT id, status FROM event_guest_registrations WHERE event_id = ? AND email = ?"
    ).get(eventId, email);
    if (existing && existing.status === "paid") return res.status(409).json({ error: "already_paid" });
    if (existing) {
      db.prepare(`
        UPDATE event_guest_registrations
        SET status = 'paid', name = ?, ticket_id = ?, amount_cents = 0,
            amount_total_cents = 0, paid_at = datetime('now')
        WHERE id = ?
      `).run(name, ticketId, existing.id);
    } else {
      db.prepare(`
        INSERT INTO event_guest_registrations
          (event_id, ticket_id, name, email, amount_cents, status, amount_total_cents, paid_at)
        VALUES (?, ?, ?, ?, 0, 'paid', 0, datetime('now'))
      `).run(eventId, ticketId, name, email);
    }
    return res.json({ ok: true, free: true, redirect: `${SITE_URL}/event/?id=${eventId}&paid=1` });
  }

  // Bezahltes Event → direkt Stripe Checkout. E-Mail/Name/Adresse erfasst Stripe;
  // die Registrierung legt der Webhook bei Zahlung an.
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: "payments_disabled" });

  const ticketLabel = ticketName
    ? `${ticketName}${ticketBadge ? ` · ${ticketBadge}` : ""}`
    : "Teilnahme";
  const ticketMeta = ticketId ? String(ticketId) : "";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "eur",
          unit_amount: amountCents,
          tax_behavior: "exclusive",
          product_data: {
            name: `${event.title} — ${ticketLabel}`,
            description: `Teilnahme · ${new Date(event.starts_at).toLocaleDateString("de-AT", { day: "2-digit", month: "long", year: "numeric" })}`,
            tax_code: "txcd_20030000", // "Live events / Admissions"
          },
        },
        quantity: 1,
      }],
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `Teilnahme: ${event.title}`,
          metadata: { event_id: String(eventId), ticket_id: ticketMeta },
          rendering_options: { amount_tax_display: "include_inclusive_tax" },
        },
      },
      // KEIN customer_email → Stripe fragt E-Mail (und mit billing_address auch
      // den Namen) selbst ab.
      billing_address_collection: "required",
      allow_promotion_codes: false,
      metadata: {
        kind: "guest",
        event_id: String(eventId),
        ticket_id: ticketMeta,
      },
      payment_intent_data: {
        description: `${event.title} (Gast)`,
        metadata: { kind: "guest", event_id: String(eventId), ticket_id: ticketMeta },
      },
      success_url: `${SITE_URL}/danke/?id=${eventId}`,
      cancel_url:  `${SITE_URL}/event/?id=${eventId}&cancelled=1`,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    });

    res.json({ ok: true, checkout_url: session.url, session_id: session.id });
  } catch (err) {
    console.error("[stripe] guest checkout session create failed:", err);
    res.status(502).json({ error: "stripe_error", detail: err?.message || "unknown" });
  }
});

// Public: Main-Event fuer den Startseiten-Banner.
// Zeigt NUR ein als "Main Event" getaggtes (oeffentliches, kommendes) Event.
// Ist keines getaggt, kommt null zurueck -> der Banner bleibt leer.
router.get("/public/next", (_req, res) => {
  const row = db
    .prepare(`
      SELECT id, title, starts_at, location, status, is_main
      FROM events
      WHERE starts_at >= datetime('now')
        AND status != 'closed'
        AND visibility = 'public'
        AND hidden = 0
        AND is_main = 1
      ORDER BY starts_at ASC
      LIMIT 1
    `)
    .get();

  if (row) row.is_main = row.is_main === 1;
  res.json({ event: row || null });
});

// Vollstaendiges Event fuer die Landingpage (Preis, Programm, Speaker, Tickets).
// Liefert visibility mit, damit die Aufrufer die Sichtbarkeit pruefen koennen.
function loadLandingEvent(id) {
  const ev = db
    .prepare(`
      SELECT id, title, starts_at, location, status,
             fee_cents, max_attendees, description, cover_path, visibility, hidden,
             member_discount_pct
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
  ev.tickets = db
    .prepare(`
      SELECT id, name, badge, featured, price_cents, member_discount_pct, perks_json FROM event_tickets
      WHERE event_id = ? ORDER BY position ASC
    `)
    .all(id)
    .map((t) => ({
      id: t.id,
      name: t.name,
      badge: t.badge,
      featured: t.featured === 1,
      price_cents: t.price_cents,
      member_discount_pct: t.member_discount_pct,
      perks: safeJson(t.perks_json),
    }));
  return ev;
}

// Public: ein einzelnes OEFFENTLICHES Event fuer die Event-Landingpage.
// Nur-Mitglieder-Events sind hier nicht abrufbar (404).
router.get("/public/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "invalid_id" });

  const ev = loadLandingEvent(id);
  if (!ev || ev.visibility !== "public" || ev.hidden === 1) return res.status(404).json({ error: "not_found" });
  delete ev.visibility;
  delete ev.hidden;
  res.json({ event: ev });
});

function safeJson(s) {
  try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; }
  catch { return []; }
}

// Member: alle Events mit nested timeline + speakers
router.get("/", requireAuth, (req, res) => {
  // Versteckte Events ("hidden") sind fuer normale Mitglieder unsichtbar;
  // Admins sehen sie weiterhin, um sie im Admin verwalten zu koennen.
  const isAdmin = req.user?.role === "admin";
  const events = db
    .prepare(`
      SELECT id, title, starts_at, location, status,
             fee_cents, max_attendees, description, cover_path,
             is_main, visibility, hidden, member_discount_pct, created_at, updated_at,
             (SELECT COUNT(*) FROM event_registrations r
                WHERE r.event_id = events.id AND r.status != 'cancelled')
             + (SELECT COUNT(*) FROM event_guest_registrations g
                WHERE g.event_id = events.id AND g.status != 'cancelled') AS registered,
             (SELECT r2.status FROM event_registrations r2
                WHERE r2.event_id = events.id AND r2.user_id = ?
                ORDER BY CASE r2.status WHEN 'paid' THEN 0 WHEN 'reserved' THEN 1
                                        WHEN 'waitlist' THEN 2 ELSE 3 END
                LIMIT 1) AS my_status
      FROM events
      ${isAdmin ? "" : "WHERE hidden = 0"}
      ORDER BY starts_at ASC
    `)
    .all(req.user.sub);

  const timelineByEvent = new Map();
  const speakersByEvent = new Map();
  const ticketsByEvent  = new Map();

  if (events.length) {
    const ids = events.map((e) => e.id);
    const placeholders = ids.map(() => "?").join(",");

    const tlRows = db
      .prepare(`
        SELECT event_id, id, time_label, label
        FROM event_timeline
        WHERE event_id IN (${placeholders})
        ORDER BY event_id, position
      `)
      .all(...ids);
    for (const r of tlRows) {
      if (!timelineByEvent.has(r.event_id)) timelineByEvent.set(r.event_id, []);
      timelineByEvent.get(r.event_id).push({ id: r.id, time_label: r.time_label, label: r.label });
    }

    const spRows = db
      .prepare(`
        SELECT event_id, id, name, bio, photo_path
        FROM event_speakers
        WHERE event_id IN (${placeholders})
        ORDER BY event_id, position
      `)
      .all(...ids);
    for (const r of spRows) {
      if (!speakersByEvent.has(r.event_id)) speakersByEvent.set(r.event_id, []);
      speakersByEvent.get(r.event_id).push({ id: r.id, name: r.name, bio: r.bio, photo_path: r.photo_path });
    }

    const tkRows = db
      .prepare(`
        SELECT event_id, id, name, badge, featured, price_cents, member_discount_pct, perks_json
        FROM event_tickets
        WHERE event_id IN (${placeholders})
        ORDER BY event_id, position
      `)
      .all(...ids);
    for (const r of tkRows) {
      if (!ticketsByEvent.has(r.event_id)) ticketsByEvent.set(r.event_id, []);
      ticketsByEvent.get(r.event_id).push({
        id: r.id, name: r.name,
        badge: r.badge, featured: r.featured === 1,
        price_cents: r.price_cents,
        member_discount_pct: r.member_discount_pct,
        perks: safeJson(r.perks_json),
      });
    }
  }

  for (const e of events) {
    e.is_main = e.is_main === 1;
    e.hidden = e.hidden === 1;
    e.timeline = timelineByEvent.get(e.id) || [];
    e.speakers = speakersByEvent.get(e.id) || [];
    e.tickets  = ticketsByEvent.get(e.id)  || [];
  }

  res.json({ events });
});

// Member: ein einzelnes Event (oeffentlich ODER nur-Mitglieder) fuer die
// Landingpage eines eingeloggten Mitglieds. Muss nach /public/:id stehen.
router.get("/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "invalid_id" });

  const ev = loadLandingEvent(id);
  const isAdmin = req.user?.role === "admin";
  if (!ev || (ev.hidden === 1 && !isAdmin)) return res.status(404).json({ error: "not_found" });
  delete ev.visibility;
  delete ev.hidden;
  res.json({ event: ev });
});

export default router;
