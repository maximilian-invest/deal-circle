// "Du bist angemeldet" — geht raus, wenn ein Admin ein Mitglied manuell zu
// einem Event hinzufuegt (ohne Zahlung, z. B. Einladung/Comp).

import {
  SITE_URL, escapeHtml, eventDateLong,
  wrapDocument, hero, ctaButton,
} from "./_shared.js";

export function eventRegistered({ event, firstName }) {
  const url      = `${SITE_URL}/event/?id=${event.id}`;
  const dateLong = eventDateLong(event.starts_at);
  const name     = escapeHtml(firstName || "");
  const subject  = `Du bist angemeldet: ${event.title}`;

  const intro =
`${firstName ? "Hallo " + firstName + "," : "Hallo,"}

du bist für das folgende Event registriert — dein Platz ist reserviert:

${event.title}
${dateLong}
${event.location}

Event-Seite: ${url}

Bei Fragen einfach auf diese Mail antworten.

Wir freuen uns auf dich.
DealCircle Salzburg`;

  const html = wrapDocument({
    preheader: `Du bist angemeldet — wir sehen uns am ${dateLong}`,
    title: subject,
    contentRows: `
      ${hero({
        eyebrow: "Anmeldung bestätigt",
        h1Html: escapeHtml(event.title),
        lede: name
          ? `Hallo <strong style="color:#fff;font-weight:600;">${name}</strong>, du bist für dieses Event registriert — dein Platz ist reserviert.`
          : `Du bist für dieses Event registriert — dein Platz ist reserviert.`,
      })}

      <tr><td style="padding:14px 6px 0 6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0E0E10;border:1px solid rgba(255,255,255,0.08);border-radius:14px;">
          <tr><td style="padding:18px 22px;">
            <p style="margin:0 0 10px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#9A9AA2;">Deine Anmeldung</p>
            <p style="margin:0 0 6px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:18px;font-weight:600;line-height:1.35;color:#ffffff;">${escapeHtml(event.title)}</p>
            <p style="margin:0 0 4px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.55;color:#C8C8CC;">${escapeHtml(dateLong)}</p>
            <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.55;color:#C8C8CC;">${escapeHtml(event.location)}</p>
          </td></tr>
        </table>
      </td></tr>

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
