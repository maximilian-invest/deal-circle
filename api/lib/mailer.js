// Zentrale Mail-Funktion. SMTP-Settings via Env:
//
//   DC_SMTP_HOST=smtp.world4you.com
//   DC_SMTP_PORT=587
//   DC_SMTP_USER=event@deal-circle.at
//   DC_SMTP_PASS=...
//   DC_SMTP_FROM=event@deal-circle.at       (optional, defaults to USER)
//   DC_SMTP_FROM_NAME=DealCircle Salzburg   (optional)
//
// Wenn HOST/USER/PASS fehlen → sendMail wird zum no-op (logged).
// Fire-and-forget via sendMailAsync(): wirft nie, schreibt Fehler nur ins log.

import nodemailer from "nodemailer";

const SMTP_HOST       = process.env.DC_SMTP_HOST;
const SMTP_PORT       = Number(process.env.DC_SMTP_PORT || 587);
const SMTP_USER       = process.env.DC_SMTP_USER;
const SMTP_PASS       = process.env.DC_SMTP_PASS;
const SMTP_FROM       = process.env.DC_SMTP_FROM || SMTP_USER;
const SMTP_FROM_NAME  = process.env.DC_SMTP_FROM_NAME || "DealCircle Salzburg";

let transporter = null;
let warnedDisabled = false;

function getTransport() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    if (!warnedDisabled) {
      console.warn("[mailer] SMTP nicht konfiguriert (DC_SMTP_HOST/USER/PASS fehlen) → Mail-Versand deaktiviert");
      warnedDisabled = true;
    }
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,   // 465 = SMTPS, 587 = STARTTLS
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      tls: { minVersion: "TLSv1.2" },
      // Timeouts, damit ein hängender Versand nicht die serialisierte
      // Mail-Queue (siehe sendMailAsync) blockiert.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, text, html, replyTo, cc, bcc }) {
  const t = getTransport();
  if (!t) {
    console.log(`[mailer] SKIP → ${to} | ${subject}`);
    return { skipped: true };
  }

  try {
    const info = await t.sendMail({
      from: `"${SMTP_FROM_NAME}" <${SMTP_FROM}>`,
      to, subject, text, html,
      replyTo: replyTo || SMTP_FROM,
      cc, bcc,
    });
    console.log(`[mailer] ✓ ${info.messageId} → ${to} | ${subject}`);
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[mailer] ✗ ${to} | ${subject} →`, err?.message || err);
    return { error: String(err?.message || err) };
  }
}

// Fire-and-forget — nie await-bar, fehler werden nur geloggt.
// Wird im Request-Handler benutzt damit die Response nicht durch
// Mail-Latenz verzoegert wird.
//
// Sends werden SERIALISIERT (eine Verbindung nach der anderen): Wenn ein
// Request mehrere Mails ausloest (z. B. Kunden-Bestaetigung + Admin-Notify),
// wuerden parallele SMTP-Verbindungen vom Provider teils oder ganz abgelehnt.
// Die Promise-Kette stellt sicher, dass immer nur eine Mail gleichzeitig
// versendet wird.
let mailChain = Promise.resolve();
export function sendMailAsync(opts) {
  mailChain = mailChain
    .then(() => sendMail(opts))
    .catch((err) => console.error("[mailer] async unexpected:", err));
}
