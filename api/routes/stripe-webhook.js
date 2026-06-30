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
        handleSessionPaid(event.data.object, stripe)
          .catch((err) => console.error("[stripe-webhook] paid handler error:", err));
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

async function handleSessionPaid(session, stripe) {
  // Gast-Checkout (ohne Login) wird separat behandelt.
  if ((session.metadata?.kind || "") === "guest") {
    return handleGuestPaid(session, stripe);
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

  // Invoice-URL SYNCHRON holen, damit die Bestaetigungsmail sie auch enthaelt.
  // (Stripe generiert die Rechnung erst nach der Zahlung.)
  let invoiceUrl = null;
  const invoiceId = session.invoice || null;
  if (invoiceId && typeof invoiceId === "string") {
    try {
      const inv = await stripe.invoices.retrieve(invoiceId);
      invoiceUrl = inv?.hosted_invoice_url || inv?.invoice_pdf || null;
    } catch (err) {
      console.warn(`[stripe-webhook] invoice retrieve failed:`, err?.message);
    }
  }

  const totalCents = session.amount_total ?? null;

  db.prepare(`
    UPDATE event_registrations
    SET status = 'paid',
        paid_at = datetime('now'),
        stripe_payment_intent_id = ?,
        stripe_invoice_id = ?,
        invoice_url = ?,
        amount_total_cents = ?
    WHERE id = ?
  `).run(session.payment_intent || null, invoiceId, invoiceUrl, totalCents, regId);

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

async function handleGuestPaid(session, stripe) {
  if (session.payment_status !== "paid") {
    console.log(`[stripe-webhook] guest session ${session.id} payment_status=${session.payment_status} — skip`);
    return;
  }
  const eventId = Number(session.metadata?.event_id);
  if (!Number.isInteger(eventId) || eventId < 1) {
    console.warn("[stripe-webhook] guest session ohne event_id:", session.id);
    return;
  }
  // E-Mail + Name kommen aus dem Stripe-Checkout (kein Vorab-Formular).
  const email = String(session.customer_details?.email || session.customer_email || "").trim().toLowerCase();
  if (!email) {
    console.warn("[stripe-webhook] guest session ohne E-Mail:", session.id);
    return;
  }
  const name = String(session.customer_details?.name || "").trim() || "Gast";
  const ticketId = session.metadata?.ticket_id ? Number(session.metadata.ticket_id) : null;
  const totalCents = session.amount_total ?? null;

  // Invoice-URL SYNCHRON holen (fuer DB + Bestaetigungsmail an den Gast).
  let invoiceUrl = null;
  const invoiceId = session.invoice || null;
  if (invoiceId && typeof invoiceId === "string") {
    try {
      const inv = await stripe.invoices.retrieve(invoiceId);
      invoiceUrl = inv?.hosted_invoice_url || inv?.invoice_pdf || null;
    } catch (err) {
      console.warn(`[stripe-webhook] guest invoice retrieve failed:`, err?.message);
    }
  }

  const event = db.prepare(
    "SELECT id, title, starts_at, location FROM events WHERE id = ?"
  ).get(eventId);
  if (!event) {
    console.warn(`[stripe-webhook] guest: event #${eventId} not found`);
    return;
  }

  // Die Gast-Registrierung wird erst hier (nach Zahlung) angelegt bzw. aktualisiert.
  const existing = db.prepare(
    "SELECT id, status FROM event_guest_registrations WHERE event_id = ? AND email = ?"
  ).get(eventId, email);
  let regId;
  if (existing) {
    if (existing.status === "paid") {
      console.log(`[stripe-webhook] guest registration #${existing.id} already paid — skip`);
      return;
    }
    db.prepare(`
      UPDATE event_guest_registrations
      SET status = 'paid', name = ?, ticket_id = ?, amount_cents = ?, amount_total_cents = ?,
          stripe_session_id = ?, stripe_payment_intent_id = ?, stripe_invoice_id = ?,
          invoice_url = ?,
          paid_at = datetime('now')
      WHERE id = ?
    `).run(name, ticketId, totalCents, totalCents, session.id,
           session.payment_intent || null, session.invoice || null, invoiceUrl, existing.id);
    regId = existing.id;
  } else {
    const info = db.prepare(`
      INSERT INTO event_guest_registrations
        (event_id, ticket_id, name, email, amount_cents, status, amount_total_cents,
         stripe_session_id, stripe_payment_intent_id, stripe_invoice_id, invoice_url, paid_at)
      VALUES (?, ?, ?, ?, ?, 'paid', ?, ?, ?, ?, ?, datetime('now'))
    `).run(eventId, ticketId, name, email, totalCents, totalCents, session.id,
           session.payment_intent || null, session.invoice || null, invoiceUrl);
    regId = info.lastInsertRowid;
  }

  console.log(`[stripe-webhook] guest registration #${regId} → paid (€ ${(totalCents/100).toFixed(2)})`);

  // Bestätigungsmail an den Gast (fire-and-forget)
  const firstName = name.split(/\s+/)[0] || "";
  const mail = eventPaid({
    event: { id: event.id, title: event.title, starts_at: event.starts_at, location: event.location },
    firstName,
    amountTotalCents: totalCents,
    invoiceUrl,
  });
  sendMailAsync({ to: email, subject: mail.subject, html: mail.html, text: mail.text });
}

function handleSessionExpired(session) {
  if ((session.metadata?.kind || "") === "guest") {
    // Gast-Registrierung wird erst bei Zahlung angelegt → bei Ablauf nichts zu tun.
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
