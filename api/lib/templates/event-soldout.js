// "Anmeldung geschlossen / wir sind vollzählig" — Update an Mitglieder.

import {
  SITE_URL, escapeHtml, eventDateShort,
  wrapDocument, hero, eventFactsBox, descriptionSection,
  programSection, speakerSection,
  ctaButton, plaintextFor,
} from "./_shared.js";

export function eventSoldout({ event, firstName }) {
  const name = escapeHtml(firstName || "");
  const url  = `${SITE_URL}/event/?id=${event.id}`;
  const dateShort = eventDateShort(event.starts_at);

  const subject = `Anmeldung geschlossen — ${event.title} (${dateShort})`;

  const intro =
`${firstName ? "Hallo " + firstName + "," : "Hallo,"}

das folgende Event ist vollzaehlig — wir koennen leider keine weiteren
Anmeldungen mehr annehmen. Auf der Event-Seite kannst du dich auf die
Warteliste setzen lassen.`;

  const text = plaintextFor(event, intro, "Auf die Warteliste", url);

  const html = wrapDocument({
    preheader: `${event.title} — Anmeldung geschlossen`,
    title: subject,
    contentRows: `
      ${hero({
        eyebrow: "Anmeldung geschlossen",
        h1Html: `${escapeHtml(event.title)}`,
        lede: name
          ? `Hallo <strong style="color:#fff;font-weight:600;">${name}</strong>, dieses Event ist <strong style="color:#fff;font-weight:600;">vollzählig</strong>. Auf der Event-Seite kannst du dich auf die Warteliste setzen lassen — wir melden uns, falls ein Platz frei wird.`
          : `Dieses Event ist <strong style="color:#fff;font-weight:600;">vollzählig</strong>. Auf der Event-Seite kannst du dich auf die Warteliste setzen lassen.`,
      })}
      ${eventFactsBox(event)}
      ${descriptionSection(event)}
      ${programSection(event)}
      ${speakerSection(event)}
      ${ctaButton(url, "Warteliste-Eintrag")}
    `,
  });

  return { subject, html, text };
}
