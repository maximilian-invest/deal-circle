// Geteilte Bausteine fuer alle Event-Mail-Templates.
// Layout: Dark-Theme, Logo-Header, Hero, Body, Footer.

export const SITE_URL    = process.env.DC_SITE_URL    || "https://deal-circle.at";
export const IMPRESSUM   = `${SITE_URL}/impressum/`;
export const DATENSCHUTZ = `${SITE_URL}/datenschutz/`;

export function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function eventDateLong(starts_at) {
  const d = new Date(starts_at);
  const date = d.toLocaleDateString("de-AT", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const time = d.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}

export function eventDateShort(starts_at) {
  const d = new Date(starts_at);
  return d.toLocaleDateString("de-AT", { day: "numeric", month: "long", year: "numeric" });
}

export function priceFromEvent(event) {
  if (event.tickets && event.tickets.length > 1) {
    const min = Math.min(...event.tickets.map((t) => t.price_cents));
    return `ab ${(min / 100).toLocaleString("de-AT")} €`;
  }
  if (event.tickets && event.tickets.length === 1) {
    return `${(event.tickets[0].price_cents / 100).toLocaleString("de-AT")} €`;
  }
  return `${(event.fee_cents / 100).toLocaleString("de-AT")} €`;
}

// Header (Logo + Wordmark)
export function header() {
  return `
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
  </tr>`;
}

// Footer (rechtliche Links)
export function footer() {
  return `
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
  </tr>`;
}

// Wrap full HTML document
export function wrapDocument({ preheader, title, contentRows }) {
  return `<!DOCTYPE html>
<html lang="de" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>${escapeHtml(title)}</title>
<!--[if mso]><style>* { font-family: Arial, sans-serif !important; }</style><![endif]-->
<style>
  @media only screen and (max-width:600px) {
    .dc-mail-shell { width: 100% !important; }
    .dc-mail-h1 { font-size: 36px !important; line-height: 1 !important; letter-spacing: -1.2px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#0A0A0B;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#0A0A0B;">
    ${escapeHtml(preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0A0A0B;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" class="dc-mail-shell" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
          ${header()}
          ${contentRows}
          ${footer()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// CTA-Button (weiss/violet)
export function ctaButton(href, label, variant = "white") {
  const bg = variant === "violet"
    ? "background:#B14CFF;background:linear-gradient(118deg,#8A4BFF 0%,#B14CFF 50%,#FF6FD8 100%);"
    : "background:#ffffff;";
  const color = "#0A0A0B";
  return `
  <tr>
    <td align="center" style="padding:30px 6px 6px 6px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="${bg}border-radius:100px;">
            <a href="${escapeHtml(href)}" style="display:inline-block;padding:17px 34px;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:600;font-size:16px;letter-spacing:-0.2px;color:${color};text-decoration:none;">
              ${escapeHtml(label)} &nbsp;&rarr;
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

// Eyebrow + h1 hero
export function hero({ eyebrow, h1Html, lede }) {
  return `
  <tr>
    <td style="padding:8px 6px 0 6px;">
      <p style="margin:0 0 18px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:#9A9AA2;">
        ${escapeHtml(eyebrow)}
      </p>
      <h1 class="dc-mail-h1" style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:48px;line-height:0.92;letter-spacing:-2px;color:#ffffff;">
        ${h1Html}
      </h1>
      ${lede ? `<p style="margin:24px 0 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:17px;line-height:1.5;color:#9A9AA2;">${lede}</p>` : ""}
    </td>
  </tr>`;
}

// Event-Fakten-Box (Datum / Ort / Preis)
export function eventFactsBox(event) {
  const dt = eventDateLong(event.starts_at);
  const price = priceFromEvent(event);
  return `
  <tr>
    <td style="padding:32px 6px 0 6px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#161618;border-radius:24px;">
        <tr>
          <td style="padding:26px 28px;">
            <p style="margin:0 0 6px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#9A9AA2;">
              Wann
            </p>
            <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:18px;line-height:1.35;color:#ffffff;font-weight:500;">
              ${escapeHtml(dt)}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 28px;border-top:1px solid rgba(255,255,255,0.08);">
            <p style="margin:0 0 6px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#9A9AA2;">
              Wo
            </p>
            <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:18px;line-height:1.35;color:#ffffff;font-weight:500;">
              ${escapeHtml(event.location)}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 28px;border-top:1px solid rgba(255,255,255,0.08);">
            <p style="margin:0 0 6px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#9A9AA2;">
              Ticket
            </p>
            <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:18px;line-height:1.35;color:#ffffff;font-weight:500;">
              ${escapeHtml(price)}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

// Programm-Sektion (timeline)
export function programSection(event) {
  if (!event.timeline || event.timeline.length === 0) return "";
  const rows = event.timeline.map((t) => `
    <tr>
      <td style="padding:14px 0;border-top:1px solid rgba(255,255,255,0.08);">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="78" style="vertical-align:top;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;font-feature-settings:'tnum';">
              ${escapeHtml(t.time_label)}
            </td>
            <td style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.4;color:#ffffff;">
              ${escapeHtml(t.label)}
            </td>
          </tr>
        </table>
      </td>
    </tr>`).join("");
  return `
  <tr>
    <td style="padding:34px 6px 0 6px;">
      <h2 style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:22px;letter-spacing:-0.8px;color:#ffffff;">
        Programm
      </h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;">
        ${rows}
      </table>
    </td>
  </tr>`;
}

// Speaker-Sektion
export function speakerSection(event) {
  if (!event.speakers || event.speakers.length === 0) return "";
  const rows = event.speakers.map((s) => `
    <tr>
      <td style="padding:18px 0;border-top:1px solid rgba(255,255,255,0.08);">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            ${s.photo_path ? `
            <td width="76" style="vertical-align:top;padding-right:18px;">
              <img src="${SITE_URL}${escapeHtml(s.photo_path)}" alt="" width="60" height="60" style="display:block;width:60px;height:60px;border-radius:50%;object-fit:cover;border:0;" />
            </td>` : ""}
            <td style="vertical-align:top;">
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:18px;font-weight:600;letter-spacing:-0.3px;color:#ffffff;">
                ${escapeHtml(s.name)}
              </p>
              ${s.bio ? `<p style="margin:6px 0 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.5;color:#9A9AA2;">${escapeHtml(s.bio)}</p>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>`).join("");
  return `
  <tr>
    <td style="padding:34px 6px 0 6px;">
      <h2 style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:22px;letter-spacing:-0.8px;color:#ffffff;">
        Speaker
      </h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;">
        ${rows}
      </table>
    </td>
  </tr>`;
}

// Tickets-Liste (wenn mehrere)
export function ticketsSection(event) {
  if (!event.tickets || event.tickets.length === 0) return "";
  const rows = event.tickets.map((t) => {
    const price = (t.price_cents / 100).toLocaleString("de-AT");
    const perks = (t.perks || []).map((p) =>
      `<li style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.5;color:#ffffff;margin-bottom:4px;">${escapeHtml(p)}</li>`
    ).join("");
    const isFeat = t.featured ? "background:linear-gradient(118deg,#8A4BFF 0%,#B14CFF 50%,#FF6FD8 100%);" : "background:#161618;";
    const ink = t.featured ? "#0A0A0B" : "#ffffff";
    const subInk = t.featured ? "rgba(10,10,11,0.7)" : "#9A9AA2";
    return `
    <tr>
      <td style="padding:8px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${isFeat}border-radius:18px;">
          <tr>
            <td style="padding:24px 24px;">
              ${t.badge ? `<p style="margin:0 0 4px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:${subInk};">${escapeHtml(t.badge)}</p>` : ""}
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:18px;font-weight:600;color:${ink};">${escapeHtml(t.name)}</p>
              <p style="margin:6px 0 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:30px;font-weight:700;letter-spacing:-1px;color:${ink};font-feature-settings:'tnum';">${price} €</p>
              <p style="margin:5px 0 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.4;color:${subInk};">exkl. MwSt. · exkl. Getränke · inkl. Dinner &amp; Aperitif</p>
              ${perks ? `<ul style="margin:14px 0 0 0;padding:0 0 0 18px;list-style:disc;">${perks}</ul>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
  }).join("");
  return `
  <tr>
    <td style="padding:34px 6px 0 6px;">
      <h2 style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:22px;letter-spacing:-0.8px;color:#ffffff;">
        Tickets
      </h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
        ${rows}
      </table>
    </td>
  </tr>`;
}

// Event-Beschreibung als Paragraph
export function descriptionSection(event) {
  if (!event.description || !event.description.trim()) return "";
  return `
  <tr>
    <td style="padding:24px 6px 0 6px;">
      <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;color:#ffffff;">
        ${escapeHtml(event.description)}
      </p>
    </td>
  </tr>`;
}

export function plaintextFor(event, intro, ctaLabel, ctaUrl) {
  const lines = [intro, ""];
  lines.push("EVENT");
  lines.push(`Titel:  ${event.title}`);
  lines.push(`Wann:   ${eventDateLong(event.starts_at)}`);
  lines.push(`Wo:     ${event.location}`);
  lines.push(`Ticket: ${priceFromEvent(event)}`);
  lines.push("");
  if (event.description) {
    lines.push(event.description);
    lines.push("");
  }
  if (event.timeline && event.timeline.length) {
    lines.push("PROGRAMM");
    for (const t of event.timeline) lines.push(`  ${t.time_label}  ${t.label}`);
    lines.push("");
  }
  if (event.speakers && event.speakers.length) {
    lines.push("SPEAKER");
    for (const s of event.speakers) {
      lines.push(`  - ${s.name}${s.bio ? "\n    " + s.bio : ""}`);
    }
    lines.push("");
  }
  if (event.tickets && event.tickets.length) {
    lines.push("TICKETS");
    for (const t of event.tickets) {
      const p = (t.price_cents / 100).toLocaleString("de-AT");
      lines.push(`  - ${t.name}: ${p} €${t.badge ? " · " + t.badge : ""}`);
      for (const pk of (t.perks || [])) lines.push(`    · ${pk}`);
    }
    lines.push("  (alle Preise exkl. MwSt. · exkl. Getränke · inkl. Dinner & Aperitif)");
    lines.push("");
  }
  lines.push(`${ctaLabel}: ${ctaUrl}`);
  lines.push("");
  lines.push("—");
  lines.push("DealCircle Salzburg · PRO ASSETS GmbH");
  lines.push(`Impressum: ${IMPRESSUM}`);
  lines.push(`Datenschutz: ${DATENSCHUTZ}`);
  return lines.join("\n");
}
