// Mail an den Antragsteller, sobald ein Admin den Aufnahme-Antrag annimmt.
// Enthält einen Link zum Setzen des Passworts (reused Passwort-Reset-Flow).
// du-Form. Design über die geteilten _shared-Bausteine.

import { wrapDocument, hero, ctaButton, escapeHtml, IMPRESSUM, DATENSCHUTZ } from "./_shared.js";

export function membershipAccepted({ firstName, setupUrl }) {
  const name = escapeHtml(firstName || "");
  const subject = "Willkommen im Circle — dein Antrag wurde angenommen";
  const preheader = "Dein Aufnahme-Antrag wurde angenommen. Richte jetzt deinen Zugang ein.";

  const contentRows = `
    ${hero({
      eyebrow: "Antrag angenommen",
      h1Html: "Willkommen<br />im Circle.",
      lede: `Hallo <strong style="color:#ffffff;font-weight:600;">${name || "und willkommen"}</strong>, wir haben deinen Antrag angenommen und freuen uns, dich im DealCircle Salzburg zu begrüßen.`,
    })}
    <tr>
      <td style="padding:30px 6px 0 6px;">
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;color:#ffffff;">
          Richte dir jetzt deinen Zugang zum Mitgliederbereich ein — dort findest du die nächsten Treffen, deine Anmeldungen und alles, was im Kreis geteilt wird. Über die offenen Details deiner Mitgliedschaft melden wir uns zusätzlich persönlich bei dir.
        </p>
      </td>
    </tr>
    ${ctaButton(setupUrl, "Passwort setzen & einloggen", "violet")}
    <tr>
      <td align="center" style="padding:14px 6px 0 6px;">
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.5;color:#6F6F77;">
          Der Link ist sieben Tage gültig. Danach kannst du jederzeit über &bdquo;Passwort vergessen&ldquo; einen neuen anfordern.
        </p>
      </td>
    </tr>`;

  const html = wrapDocument({ preheader, title: subject, contentRows });

  const text =
`Willkommen im Circle.

Hallo${firstName ? " " + firstName : ""},

wir haben deinen Antrag angenommen und freuen uns, dich im DealCircle
Salzburg zu begrüßen.

Richte dir jetzt deinen Zugang zum Mitgliederbereich ein:
${setupUrl}

Der Link ist sieben Tage gültig. Über die offenen Details deiner
Mitgliedschaft melden wir uns zusätzlich persönlich bei dir.

— —
DealCircle Salzburg · PRO ASSETS GmbH
Impressum: ${IMPRESSUM}
Datenschutz: ${DATENSCHUTZ}`;

  return { subject, html, text };
}
