// Bestätigungs-Mail an den Antragsteller nach Einreichen des Aufnahme-Antrags.
// du-Form. Design über die geteilten _shared-Bausteine (Dark-Theme, Logo, Footer).

import { wrapDocument, hero, escapeHtml, IMPRESSUM, DATENSCHUTZ } from "./_shared.js";

export function membershipApplicationReceived({ firstName }) {
  const name = escapeHtml(firstName || "");
  const subject = "Danke für deinen Antrag — wir prüfen ihn jetzt";
  const preheader = "Dein Antrag auf Aufnahme in den DealCircle Salzburg ist eingegangen.";

  const steps = [
    ["Antrag", "Eingegangen — du musst nichts weiter tun.", true],
    ["Prüfung", "Wir sehen uns dein Profil in Ruhe an und melden uns innerhalb von zehn Tagen persönlich.", false],
    ["Aufnahme", "Erst nach einem persönlichen Gespräch und gegenseitigem Ja wird der Beitrag fällig.", false],
  ];
  const stepsRows = steps.map(([h, b, done], i) => `
    <tr>
      <td style="padding:18px 0;border-top:1px solid rgba(255,255,255,0.08);${i === steps.length - 1 ? "border-bottom:1px solid rgba(255,255,255,0.08);" : ""}">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="34" style="vertical-align:top;">
              <div style="width:24px;height:24px;border-radius:50%;background:${done ? "#B14CFF" : "#2A2A2E"};text-align:center;line-height:24px;font-family:Arial,sans-serif;font-weight:700;font-size:13px;color:${done ? "#0A0A0B" : "#9A9AA2"};">${done ? "&#10003;" : i + 1}</div>
            </td>
            <td style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.5;color:#ffffff;">
              <strong style="font-weight:600;">${escapeHtml(h)}</strong> &mdash; <span style="color:#9A9AA2;">${escapeHtml(b)}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>`).join("");

  const contentRows = `
    ${hero({
      eyebrow: "Antrag eingegangen",
      h1Html: "Danke für<br />deinen Antrag.",
      lede: `Hallo <strong style="color:#ffffff;font-weight:600;">${name || "und willkommen"}</strong>, dein Antrag auf Aufnahme in den DealCircle Salzburg ist bei uns eingegangen.`,
    })}
    <tr>
      <td style="padding:30px 6px 0 6px;">
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;color:#ffffff;">
          Wir prüfen ihn jetzt in Ruhe und sehen uns an, ob ein Platz im Kreis für beide Seiten passt. Du hörst innerhalb von zehn Tagen persönlich von uns. Bis dahin wird nichts berechnet — der Antrag ist kostenlos und unverbindlich.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:30px 6px 0 6px;">
        <p style="margin:0 0 6px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#9A9AA2;">So geht es weiter</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
          ${stepsRows}
        </table>
      </td>
    </tr>`;

  const html = wrapDocument({ preheader, title: subject, contentRows });

  const text =
`Danke für deinen Antrag.

Hallo${firstName ? " " + firstName : ""},

dein Antrag auf Aufnahme in den DealCircle Salzburg ist bei uns eingegangen.
Wir prüfen ihn jetzt in Ruhe und sehen uns an, ob ein Platz im Kreis für
beide Seiten passt. Du hörst innerhalb von zehn Tagen persönlich von uns.
Bis dahin wird nichts berechnet — der Antrag ist kostenlos und unverbindlich.

SO GEHT ES WEITER
  1. Antrag  — eingegangen, du musst nichts weiter tun.
  2. Prüfung — wir melden uns innerhalb von zehn Tagen persönlich.
  3. Aufnahme — erst nach einem Gespräch und gegenseitigem Ja wird der Beitrag fällig.

— —
DealCircle Salzburg · PRO ASSETS GmbH
Impressum: ${IMPRESSUM}
Datenschutz: ${DATENSCHUTZ}`;

  return { subject, html, text };
}
