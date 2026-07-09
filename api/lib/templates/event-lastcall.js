// "Last Call" — dringender Aufruf: Event findet nur bei genug Anmeldungen statt.

import {
  SITE_URL, escapeHtml, eventDateShort,
  wrapDocument, hero, eventFactsBox, descriptionSection,
  programSection, speakerSection,
  ctaButton, plaintextFor,
} from "./_shared.js";

// Dringlichkeits-Box: "der Abend steht auf der Kippe"
function urgencyCallout() {
  return `
  <tr>
    <td style="padding:26px 6px 0 6px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1B1216;border:1px solid #7A2A55;border-radius:16px;">
        <tr>
          <td style="padding:18px 20px;">
            <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.55;color:#FFB3E6;font-weight:600;">
              Dieser Abend steht auf der Kippe.
            </p>
            <p style="margin:6px 0 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.6;color:#C9A9BC;">
              Wir brauchen jetzt die letzten Anmeldungen, damit er stattfinden kann. Sichere dir deinen Platz noch heute — danach entscheidet sich, ob wir durchstarten oder absagen müssen.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

export function eventLastcall({ event, firstName }) {
  const name = escapeHtml(firstName || "");
  const url  = `${SITE_URL}/event/?id=${event.id}`;
  const dateShort = eventDateShort(event.starts_at);

  const subject = `Last Call: ${event.title} — jetzt Ticket sichern (${dateShort})`;

  const intro =
`${firstName ? "Hallo " + firstName + "," : "Hallo,"}

LAST CALL! Fuer den folgenden Abend fehlen uns noch ein paar Anmeldungen — und
ohne genuegend Teilnehmer koennen wir ihn leider nicht durchfuehren.

Wenn du dabei sein willst, ist jetzt der Moment: Sichere dir dein Ticket, bevor
wir absagen muessen. Das ist wirklich die letzte Chance.`;

  const text = plaintextFor(event, intro, "Jetzt Ticket sichern", url);

  const html = wrapDocument({
    preheader: `Last Call — ${event.title} findet nur mit genug Anmeldungen statt`,
    title: subject,
    contentRows: `
      ${hero({
        eyebrow: "Last Call",
        h1Html: `${escapeHtml(event.title)}`,
        lede: name
          ? `Hallo <strong style="color:#fff;font-weight:600;">${name}</strong>, für diesen Abend fehlen uns noch <strong style="color:#FF6FD8;font-weight:600;">Anmeldungen</strong>. Ohne genügend Teilnehmer müssen wir das Event leider <strong style="color:#fff;font-weight:600;">absagen</strong> — das ist deine letzte Chance, dabei zu sein.`
          : `Für diesen Abend fehlen uns noch <strong style="color:#FF6FD8;font-weight:600;">Anmeldungen</strong>. Ohne genügend Teilnehmer müssen wir das Event leider <strong style="color:#fff;font-weight:600;">absagen</strong> — das ist die letzte Chance.`,
      })}
      ${urgencyCallout()}
      ${eventFactsBox(event)}
      ${descriptionSection(event)}
      ${programSection(event)}
      ${speakerSection(event)}
      ${ctaButton(url, "Jetzt Ticket sichern", "violet")}
      <tr><td style="padding:10px 6px 0 6px;">
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.6;color:#6F6F77;text-align:center;">
          Falls der Button nicht funktioniert: <a href="${escapeHtml(url)}" style="color:#9A9AA2;">${escapeHtml(url)}</a>
        </p>
      </td></tr>
    `,
  });

  return { subject, html, text };
}
