// "Zahlung bestaetigt" — geht raus nachdem Stripe-Webhook eine
// Anmeldung auf 'paid' gesetzt hat.

import {
  SITE_URL, escapeHtml, eventDateLong,
  wrapDocument, hero, ctaButton,
} from "./_shared.js";

export function eventPaid({ event, firstName, amountTotalCents, invoiceUrl }) {
  const url       = `${SITE_URL}/event/?id=${event.id}`;
  const dateLong  = eventDateLong(event.starts_at);
  const name      = escapeHtml(firstName || "");
  const totalEur  = amountTotalCents != null
    ? (amountTotalCents / 100).toLocaleString("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : null;
  const subject   = `Zahlung bestätigt: ${event.title}`;

  const intro =
`${firstName ? "Hallo " + firstName + "," : "Hallo,"}

deine Zahlung ist eingegangen — der Platz ist fix.

${event.title}
${dateLong}
${event.location}

${totalEur ? `Betrag (inkl. MwSt): € ${totalEur}\n` : ""}${invoiceUrl ? `Rechnung: ${invoiceUrl}\n` : ""}
Event-Seite: ${url}

Die Rechnung kommt zusätzlich automatisch von Stripe in dein Postfach.
Bei Fragen einfach auf diese Mail antworten.

Wir freuen uns auf dich.
DealCircle Salzburg`;

  const html = wrapDocument({
    preheader: `Zahlung bestätigt — wir sehen uns am ${eventDateLong(event.starts_at)}`,
    title: subject,
    contentRows: `
      ${hero({
        eyebrow: "Zahlung bestätigt",
        h1Html: escapeHtml(event.title),
        lede: name
          ? `Hallo <strong style="color:#fff;font-weight:600;">${name}</strong>, deine Zahlung ist da — dein Platz ist fix reserviert.`
          : `Deine Zahlung ist da — der Platz ist fix reserviert.`,
      })}

      <tr><td style="padding:14px 6px 0 6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0E0E10;border:1px solid rgba(255,255,255,0.08);border-radius:14px;">
          <tr><td style="padding:18px 22px;">
            <p style="margin:0 0 10px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#9A9AA2;">Deine Anmeldung</p>
            <p style="margin:0 0 6px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:18px;font-weight:600;line-height:1.35;color:#ffffff;">${escapeHtml(event.title)}</p>
            <p style="margin:0 0 4px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.55;color:#C8C8CC;">${escapeHtml(dateLong)}</p>
            <p style="margin:0 0 12px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.55;color:#C8C8CC;">${escapeHtml(event.location)}</p>
            ${totalEur ? `
            <p style="margin:0;padding-top:12px;border-top:1px solid rgba(255,255,255,0.08);font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#C8C8CC;">
              <span style="color:#9A9AA2;">Betrag (inkl. MwSt):</span>
              <span style="color:#ffffff;font-weight:600;font-variant-numeric:tabular-nums;float:right;">€ ${totalEur}</span>
            </p>` : ""}
          </td></tr>
        </table>
      </td></tr>

      ${invoiceUrl ? `
      <tr><td style="padding:14px 6px 0 6px;">
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.6;color:#C8C8CC;">
          📄 Deine <a href="${escapeHtml(invoiceUrl)}" style="color:#ffffff;text-decoration:underline;">Rechnung als PDF</a> ist bereit — sie kommt zusätzlich automatisch von Stripe in dein Postfach.
        </p>
      </td></tr>` : `
      <tr><td style="padding:14px 6px 0 6px;">
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.6;color:#C8C8CC;">
          📄 Die Rechnung kommt automatisch von Stripe in dein Postfach (kann ein paar Minuten dauern).
        </p>
      </td></tr>`}

      ${ctaButton(url, "Zur Event-Seite", "white")}

      <tr><td style="padding:18px 6px 0 6px;">
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.6;color:#9A9AA2;">
          Bei Fragen einfach auf diese Mail antworten — wir melden uns persönlich zurück.
        </p>
      </td></tr>
    `,
  });

  return { subject, html, text: intro };
}
