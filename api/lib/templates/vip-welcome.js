// VIP-Willkommens-Mail an den Kunden nach erfolgreicher Anmeldung.
// HTML aus Claude-Design-Handoff e5785216 / e3a58fd1 portiert.
// Lieferte (html, text) — Plaintext-Fallback fuer Mail-Clients ohne HTML.

const SITE_URL    = process.env.DC_SITE_URL    || "https://deal-circle.at";
const DASHBOARD   = `${SITE_URL}/mitglieder/login/`;
const IMPRESSUM   = `${SITE_URL}/impressum/`;
const DATENSCHUTZ = `${SITE_URL}/datenschutz/`;

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function vipWelcome({ firstName }) {
  const name = escapeHtml(firstName || "");

  const subject = "Willkommen im Circle — deine Mitgliedschaft ist aktiviert";

  const text =
`Mitgliedschaft aktiviert.

Willkommen im Circle.

Hallo${firstName ? " " + firstName : ""},

danke fuer deine Treue. Du bist seit Tag eins dabei — und genau dafuer
schenken wir dir dein erstes Jahr Mitgliedschaft.

DEIN TREUE-BONUS
1 Jahr Mitgliedschaft gratis.
Kein Haken, keine versteckten Kosten. Dein Platz im Circle ist gesichert.

Du hast deine Mitgliedschaft aktiviert. Ab sofort gehoerst du fest zum
Deal Circle. Das erwartet dich:

  ✓ Erstes Jahr Mitgliedschaft — geschenkt, weil du von Anfang an dabei bist.
  ✓ Zugang zu exklusiven Events — vor allen anderen eingeladen.
  ✓ Preis-Ermaessigungen fuer alle zukuenftigen Events des Deal Circle.

Zu deinem Mitgliedsbereich:
${DASHBOARD}

— —
DealCircle Salzburg · PRO ASSETS GmbH
Salzburg · Wien · Muenchen · Zuerich
Impressum: ${IMPRESSUM}
Datenschutz: ${DATENSCHUTZ}`;

  const html =
`<!DOCTYPE html>
<html lang="de" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>Willkommen im Circle</title>
<!--[if mso]>
<style>* { font-family: Arial, sans-serif !important; }</style>
<![endif]-->
</head>
<body style="margin:0;padding:0;background:#0A0A0B;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#0A0A0B;">
    Deine Mitgliedschaft ist aktiviert — dein erstes Jahr im Deal Circle geht aufs Haus.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0A0A0B;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

          <!-- header -->
          <tr>
            <td style="padding:0 0 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#161618;border-radius:16px;">
                <tr>
                  <td style="padding:22px 28px;" align="left">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:14px;">
                          <img src="${SITE_URL}/assets/logo-dc-white.png"
                               alt="DealCircle"
                               width="40" height="32"
                               style="display:block;width:40px;height:auto;border:0;outline:none;text-decoration:none;" />
                        </td>
                        <td style="vertical-align:middle;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:21px;letter-spacing:-0.8px;color:#ffffff;">
                          DealCircle
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- hero -->
          <tr>
            <td style="padding:8px 6px 0 6px;">
              <p style="margin:0 0 18px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:#9A9AA2;">
                Mitgliedschaft aktiviert
              </p>
              <h1 style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:54px;line-height:0.92;letter-spacing:-2.4px;color:#ffffff;">
                Willkommen<br />im Circle.
              </h1>
              <p style="margin:24px 0 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:17px;line-height:1.5;color:#9A9AA2;">
                Hallo <strong style="color:#ffffff;font-weight:600;">${name || "Mitglied"}</strong>, danke für deine Treue. Du bist seit Tag eins dabei — und genau dafür schenken wir dir dein erstes Jahr Mitgliedschaft.
              </p>
            </td>
          </tr>

          <!-- gift card -->
          <tr>
            <td style="padding:32px 6px 0 6px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#B14CFF;background:linear-gradient(118deg,#8A4BFF 0%,#B14CFF 50%,#FF6FD8 100%);border-radius:24px;">
                <tr>
                  <td style="padding:34px 32px;">
                    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:rgba(10,10,11,0.6);">
                      Dein Treue-Bonus
                    </p>
                    <p style="margin:14px 0 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:42px;line-height:0.92;letter-spacing:-1.6px;color:#0A0A0B;">
                      1 Jahr Mitgliedschaft<br />gratis.
                    </p>
                    <p style="margin:16px 0 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.45;color:rgba(10,10,11,0.72);">
                      Kein Haken, keine versteckten Kosten. Dein Platz im Circle ist gesichert.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- confirmation -->
          <tr>
            <td style="padding:34px 6px 0 6px;">
              <h2 style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:26px;letter-spacing:-1px;color:#ffffff;">
                Du hast deine Mitgliedschaft aktiviert.
              </h2>
              <p style="margin:14px 0 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.55;color:#9A9AA2;">
                Ab sofort gehörst du fest zum Deal Circle. Das erwartet dich:
              </p>
            </td>
          </tr>

          <!-- benefits -->
          <tr>
            <td style="padding:24px 6px 0 6px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:18px 0;border-top:1px solid rgba(255,255,255,0.08);">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="34" style="vertical-align:top;">
                          <div style="width:24px;height:24px;border-radius:50%;background:#B14CFF;text-align:center;line-height:24px;font-family:Arial,sans-serif;font-weight:700;font-size:14px;color:#0A0A0B;">&#10003;</div>
                        </td>
                        <td style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.5;color:#ffffff;">
                          <strong style="font-weight:600;">Erstes Jahr Mitgliedschaft</strong> — geschenkt, weil du von Anfang an dabei bist.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 0;border-top:1px solid rgba(255,255,255,0.08);">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="34" style="vertical-align:top;">
                          <div style="width:24px;height:24px;border-radius:50%;background:#B14CFF;text-align:center;line-height:24px;font-family:Arial,sans-serif;font-weight:700;font-size:14px;color:#0A0A0B;">&#10003;</div>
                        </td>
                        <td style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.5;color:#ffffff;">
                          <strong style="font-weight:600;">Zugang zu exklusiven Events</strong> — vor allen anderen eingeladen.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 0;border-top:1px solid rgba(255,255,255,0.08);border-bottom:1px solid rgba(255,255,255,0.08);">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="34" style="vertical-align:top;">
                          <div style="width:24px;height:24px;border-radius:50%;background:#B14CFF;text-align:center;line-height:24px;font-family:Arial,sans-serif;font-weight:700;font-size:14px;color:#0A0A0B;">&#10003;</div>
                        </td>
                        <td style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.5;color:#ffffff;">
                          <strong style="font-weight:600;">Preis-Ermäßigungen</strong> für alle zukünftigen Events des Deal Circle.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:34px 6px 6px 6px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#ffffff;border-radius:100px;">
                    <a href="${DASHBOARD}" style="display:inline-block;padding:17px 34px;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:600;font-size:16px;letter-spacing:-0.2px;color:#0A0A0B;text-decoration:none;">
                      Zu deinem Mitgliedsbereich &nbsp;&rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- footer -->
          <tr>
            <td style="padding:40px 6px 8px 6px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid rgba(255,255,255,0.08);">
                <tr>
                  <td style="padding:24px 0 0 0;">
                    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.6;color:#6F6F77;">
                      DealCircle Salzburg &nbsp;&middot;&nbsp; Salzburg &middot; Wien &middot; München &middot; Zürich
                    </p>
                    <p style="margin:12px 0 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.6;color:#6F6F77;">
                      <a href="${IMPRESSUM}" style="color:#6F6F77;text-decoration:none;">Impressum</a> &nbsp;&nbsp;
                      <a href="${DATENSCHUTZ}" style="color:#6F6F77;text-decoration:none;">Datenschutz</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
