// Passwort-Reset Mail im DealCircle-Style (dunkel, violet-accent).

const SITE_URL    = process.env.DC_SITE_URL    || "https://deal-circle.at";
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

export function passwordReset({ firstName, link }) {
  const name = escapeHtml(firstName || "");
  const url  = escapeHtml(link);

  const subject = "Passwort zurücksetzen — DealCircle";

  const text =
`Passwort zuruecksetzen.

Hallo${firstName ? " " + firstName : ""},

du hast ein neues Passwort fuer deinen DealCircle-Zugang angefordert.
Klick einfach auf den folgenden Link — gueltig fuer 60 Minuten:

${link}

Falls du das nicht warst, kannst du diese Mail ignorieren — dein
aktuelles Passwort bleibt gueltig.

— —
DealCircle Salzburg · PRO ASSETS GmbH
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
<title>Passwort zurücksetzen</title>
<!--[if mso]>
<style>* { font-family: Arial, sans-serif !important; }</style>
<![endif]-->
</head>
<body style="margin:0;padding:0;background:#0A0A0B;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#0A0A0B;">
    Setz dein DealCircle-Passwort innerhalb von 60 Minuten zurueck.
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
                          <img src="${SITE_URL}/assets/logo-dc-white.png" alt="DealCircle" width="40" height="32" style="display:block;width:40px;height:auto;border:0;outline:none;text-decoration:none;" />
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
                Passwort zurücksetzen
              </p>
              <h1 style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:48px;line-height:0.94;letter-spacing:-2px;color:#ffffff;">
                Neues Passwort<br />setzen.
              </h1>
              <p style="margin:24px 0 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.55;color:#9A9AA2;">
                Hallo <strong style="color:#ffffff;font-weight:600;">${name || "Mitglied"}</strong>, du hast für deinen DealCircle-Zugang ein neues Passwort angefordert. Klick auf den Button — der Link gilt für 60 Minuten.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:34px 6px 6px 6px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#B14CFF;background:linear-gradient(118deg,#8A4BFF 0%,#B14CFF 50%,#FF6FD8 100%);border-radius:100px;">
                    <a href="${url}" style="display:inline-block;padding:17px 34px;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:600;font-size:16px;letter-spacing:-0.2px;color:#0A0A0B;text-decoration:none;">
                      Passwort jetzt zurücksetzen
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- fallback link -->
          <tr>
            <td style="padding:24px 6px 0 6px;">
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.55;color:#6F6F77;">
                Funktioniert der Button nicht? Kopiere diese Adresse in deinen Browser:
              </p>
              <p style="margin:8px 0 0 0;font-family:'Courier New',monospace;font-size:12px;line-height:1.5;color:#9A9AA2;word-break:break-all;">
                ${url}
              </p>
            </td>
          </tr>

          <!-- security note -->
          <tr>
            <td style="padding:30px 6px 0 6px;">
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.6;color:#6F6F77;">
                <strong style="color:#9A9AA2;font-weight:600;">Du warst das nicht?</strong> Dann kannst du diese Mail einfach ignorieren — dein aktuelles Passwort bleibt gültig.
              </p>
            </td>
          </tr>

          <!-- footer -->
          <tr>
            <td style="padding:40px 6px 8px 6px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid rgba(255,255,255,0.08);">
                <tr>
                  <td style="padding:24px 0 0 0;">
                    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.6;color:#6F6F77;">
                      DealCircle Salzburg &nbsp;&middot;&nbsp; PRO ASSETS GmbH
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
