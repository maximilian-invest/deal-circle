// "Nur noch wenige Plätze" — Knappheits-Reminder.

import {
  SITE_URL, escapeHtml, eventDateShort,
  wrapDocument, hero, eventFactsBox, descriptionSection,
  programSection, speakerSection,
  ctaButton, plaintextFor,
} from "./_shared.js";

export function eventLimited({ event, firstName }) {
  const name = escapeHtml(firstName || "");
  const url  = `${SITE_URL}/event/?id=${event.id}`;
  const dateShort = eventDateShort(event.starts_at);

  const subject = `Nur noch wenige Plätze: ${event.title} (${dateShort})`;

  const intro =
`${firstName ? "Hallo " + firstName + "," : "Hallo,"}

fuer das folgende Event sind nur noch wenige Plaetze frei.
Wenn du dabei sein willst — schnell anmelden:`;

  const text = plaintextFor(event, intro, "Letzte Plaetze sichern", url);

  const html = wrapDocument({
    preheader: `${event.title} — nur noch wenige Plätze`,
    title: subject,
    contentRows: `
      ${hero({
        eyebrow: "Wenige Plätze",
        h1Html: `${escapeHtml(event.title)}`,
        lede: name
          ? `Hallo <strong style="color:#fff;font-weight:600;">${name}</strong>, für dieses Event sind <strong style="color:#FF6FD8;font-weight:600;">nur noch wenige Plätze</strong> frei.`
          : `Für dieses Event sind <strong style="color:#FF6FD8;font-weight:600;">nur noch wenige Plätze</strong> frei.`,
      })}
      ${eventFactsBox(event)}
      ${descriptionSection(event)}
      ${programSection(event)}
      ${speakerSection(event)}
      ${ctaButton(url, "Letzten Platz sichern", "violet")}
      <tr><td style="padding:10px 6px 0 6px;">
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.6;color:#6F6F77;text-align:center;">
          Falls der Button nicht funktioniert: <a href="${escapeHtml(url)}" style="color:#9A9AA2;">${escapeHtml(url)}</a>
        </p>
      </td></tr>
    `,
  });

  return { subject, html, text };
}
