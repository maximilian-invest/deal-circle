import { Router } from "express";
import db from "../db.js";
import { getStripe, getWebhookSecret } from "../lib/stripe.js";
import { sendMailAsync } from "../lib/mailer.js";
import { eventPaid } from "../lib/templates/event-paid.js";

const router = Router();

// HINWEIS: dieses Router muss im server.js MIT express.raw() gemountet sein
// und VOR app.use(express.json()) — Stripe verlangt raw body fuer
// Signatur-Verifikation.
router.post("/", (req, res) => {
  const stripe = getStripe();
  const whSecret = getWebhookSecret();

  if (!stripe || !whSecret) {
    console.warn("[stripe-webhook] disabled — secret/key fehlt");
    return res.status(503).send("payments_disabled");
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) return res.status(400).send("missing_signature");

  let event;
  try {
    // req.body ist hier ein Buffer (raw)
    event = stripe.webhooks.constructEvent(req.body, sig, whSecret);
  } catch (err) {
    console.error("[stripe-webhook] signature verify failed:", err?.message);
    return res.status(400).send(`webhook_error: ${err?.message}`);
  }

  // Wichtig: schnell 200 zurück, schwere Arbeit fire-and-forget
  res.json({ received: true });

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        handleSessionPaid(event.data.object, stripe);
        break;
      case "checkout.session.expired":
        handleSessionExpired(event.data.object);
        break;
      default:
        // andere Events ignorieren
        break;
    }
  } catch (err) {
    console.error("[stripe-webhook] handler error:", err);
  }
});

function handleSessionPaid(session, stripe) {
  // Gast-Checkout (ohne Login) wird separat behandelt.
  if ((session.metadata?.kind || "") === "guest") {
    handleGuestPaid(session, stripe);
    return;
  }
  const regId = Number(session.metadata?.registration_id);
  if (!Number.isInteger(regId) || regId < 1) {
    console.warn("[stripe-webhook] session ohne registration_id metadata:", session.id);
    return;
  }
  if (session.payment_status !== "paid") {
    console.log(`[stripe-webhook] session ${session.id} payment_status=${session.payment_status} — skip`);
    return;
  }

  const reg = db.prepare(`
    SELECT r.id, r.event_id, r.status,
           e.title AS event_title, e.starts_at, e.location,
           u.email, u.name AS user_name
    FROM event_registrations r
    JOIN events e ON e.id = r.event_id
    JOIN users u  ON u.id = r.user_id
    WHERE r.id = ?
  `).get(regId);
  if (!reg) {
    console.warn(`[stripe-webhook] registration #${regId} not found`);
    return;
  }
  if (reg.status === "paid") {
    console.log(`[stripe-webhook] registration #${regId} already paid — skip`);
    return;
  }

  // Invoice URL nachholen (async, weil Stripe sie erst nach session.create generiert)
  // Wir versuchen es; wenn nicht da, leer lassen.
  let invoiceUrl = null;
  let invoiceId = session.invoice || null;
  if (invoiceId && typeof invoiceId === "string") {
    stripe.invoices.retrieve(invoiceId)
      .then((inv) => {
        db.prepare(`UPDATE event_registrations SET invoice_url = ? WHERE id = ?`)
          .run(inv?.hosted_invoice_url || inv?.invoice_pdf || null, regId);
      })
      .catch((err) => console.warn(`[stripe-webhook] invoice retrieve failed:`, err?.message));
  }

  const totalCents = session.amount_total ?? null;

  db.prepare(`
    UPDATE event_registrations
    SET status = 'paid',
        paid_at = datetime('now'),
        stripe_payment_intent_id = ?,
        stripe_invoice_id = ?,
        amount_total_cents = ?
    WHERE id = ?
  `).run(session.payment_intent || null, invoiceId, totalCents, regId);

  console.log(`[stripe-webhook] registration #${regId} → paid (€ ${(totalCents/100).toFixed(2)})`);

  // Bestätigungsmail (fire-and-forget)
  const firstName = (reg.user_name || "").split(/\s+/)[0] || "";
  const mail = eventPaid({
    event: {
      id: reg.event_id,
      title: reg.event_title,
      starts_at: reg.starts_at,
      location: reg.location,
    },
    firstName,
    amountTotalCents: totalCents,
    invoiceUrl,
  });
  sendMailAsync({
    to: reg.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
}

function handleGuestPaid(session, stripe) {
  const regId = Number(session.metadata?.guest_registration_id);
  if (!Number.isInteger(regId) || regId < 1) {
    console.warn("[stripe-webhook] guest session ohne guest_registration_id:", session.id);
    return;
  }
  if (session.payment_status !== "paid") {
    console.log(`[stripe-webhook] guest session ${session.id} payment_status=${session.payment_status} — skip`);
    return;
  }

  const reg = db.prepare(`
    SELECT g.id, g.event_id, g.status, g.name, g.email,
           e.title AS event_title, e.starts_at, e.location
    FROM event_guest_registrations g
    JOIN events e ON e.id = g.event_id
    WHERE g.id = ?
  `).get(regId);
  if (!reg) {
    console.warn(`[stripe-webhook] guest registration #${regId} not found`);
    return;
  }
  if (reg.status === "paid") {
    console.log(`[stripe-webhook] guest registration #${regId} already paid — skip`);
    return;
  }

  let invoiceId = session.invoice || null;
  if (invoiceId && typeof invoiceId === "string") {
    stripe.invoices.retrieve(invoiceId)
      .then((inv) => {
        db.prepare(`UPDATE event_guest_registrations SET invoice_url = ? WHERE id = ?`)
          .run(inv?.hosted_invoice_url || inv?.invoice_pdf || null, regId);
      })
      .catch((err) => console.warn(`[stripe-webhook] guest invoice retrieve failed:`, err?.message));
  }

  const totalCents = session.amount_total ?? null;

  db.prepare(`
    UPDATE event_guest_registrations
    SET status = 'paid',
        paid_at = datetime('now'),
        stripe_payment_intent_id = ?,
        stripe_invoice_id = ?,
        amount_total_cents = ?
    WHERE id = ?
  `).run(session.payment_intent || null, invoiceId, totalCents, regId);

  console.log(`[stripe-webhook] guest registration #${regId} → paid (€ ${(totalCents/100).toFixed(2)})`);

  // Bestätigungsmail an den Gast (fire-and-forget)
  const firstName = (reg.name || "").split(/\s+/)[0] || "";
  const mail = eventPaid({
    event: {
      id: reg.event_id,
      title: reg.event_title,
      starts_at: reg.starts_at,
      location: reg.location,
    },
    firstName,
    amountTotalCents: totalCents,
    invoiceUrl: null,
  });
  sendMailAsync({ to: reg.email, subject: mail.subject, html: mail.html, text: mail.text });
}

function handleSessionExpired(session) {
  if ((session.metadata?.kind || "") === "guest") {
    const gid = Number(session.metadata?.guest_registration_id);
    if (!Number.isInteger(gid)) return;
    db.prepare(`
      UPDATE event_guest_registrations SET stripe_session_id = NULL WHERE id = ? AND status != 'paid'
    `).run(gid);
    console.log(`[stripe-webhook] guest session #${session.id} expired — guest reg #${gid} bleibt reserved`);
    return;
  }
  const regId = Number(session.metadata?.registration_id);
  if (!Number.isInteger(regId)) return;
  // session_id-Referenz löschen, Registration bleibt "reserved" → User kann erneut bezahlen
  db.prepare(`
    UPDATE event_registrations SET stripe_session_id = NULL WHERE id = ? AND status != 'paid'
  `).run(regId);
  console.log(`[stripe-webhook] session #${session.id} expired — registration #${regId} bleibt reserved`);
}

export default router;
