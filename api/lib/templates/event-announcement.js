// "Anmeldung jetzt möglich" — Event-Einladung mit allen Daten.

import {
  SITE_URL, escapeHtml, eventDateShort,
  wrapDocument, hero, eventFactsBox, descriptionSection,
  programSection, speakerSection, ticketsSection,
  ctaButton, plaintextFor,
} from "./_shared.js";

export function eventAnnouncement({ event, firstName }) {
  const name = escapeHtml(firstName || "");
  const url  = `${SITE_URL}/event/?id=${event.id}`;
  const dateShort = eventDateShort(event.starts_at);

  const subject = `Anmeldung jetzt möglich: ${event.title} (${dateShort})`;

  const intro =
`${firstName ? "Hallo " + firstName + "," : "Hallo,"}

die Anmeldung fuer unser naechstes Event ist offen. Hier alle Details:`;

  const text = plaintextFor(event, intro, "Zur Event-Seite & Anmeldung", url);

  const html = wrapDocument({
    preheader: `${event.title} — Anmeldung jetzt möglich`,
    title: subject,
    contentRows: `
      ${hero({
        eyebrow: "Anmeldung jetzt möglich",
        h1Html: escapeHtml(event.title),
        lede: name
          ? `Hallo <strong style="color:#fff;font-weight:600;">${name}</strong>, hier alle Details — und der Button am Ende führt direkt zur Anmeldung.`
          : `Hier alle Details zum Event — der Button am Ende führt direkt zur Anmeldung.`,
      })}
      ${eventFactsBox(event)}
      ${descriptionSection(event)}
      ${programSection(event)}
      ${speakerSection(event)}
      ${ticketsSection(event)}
      ${ctaButton(url, "Jetzt anmelden")}
      <tr><td style="padding:10px 6px 0 6px;">
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.6;color:#6F6F77;text-align:center;">
          Falls der Button nicht funktioniert: <a href="${escapeHtml(url)}" style="color:#9A9AA2;">${escapeHtml(url)}</a>
        </p>
      </td></tr>
    `,
  });

  return { subject, html, text };
}
