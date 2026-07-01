// Section-anchor links bekommen einen führenden "/" → funktionieren
// auch von Unterseiten aus (event/, vip/, impressum/ …).
export default function Footer() {
  const cols: { h: string; l: [string, string][] }[] = [
    { h: "Konzept", l: [
      ["Was ist DealCircle", "/#konzept"],
      ["Format & Ablauf",   "/#format"],
      ["Rhythmus",          "/#rhythmus"],
      ["Werte",             "/#werte"],
    ]},
    { h: "Kontakt", l: [
      ["Mitglied werden",        "/mitglied-werden/"],
      ["Sponsor werden",         "/sponsordeck/"],
      ["event@deal-circle.at",   "mailto:event@deal-circle.at"],
      ["FAQ",                    "/#faq"],
    ]},
    { h: "Standort", l: [
      ["Schloss Wiespach", "#"],
      ["Hallein",          "#"],
      ["Salzburger Land",  "#"],
    ]},
    { h: "Rechtliches", l: [
      ["Impressum",     "/impressum/"],
      ["Datenschutz",   "/datenschutz/"],
    ]},
  ];
  return (
    <footer className="dc-footer">
      <div className="dc-footer-top">
        <a href="/" className="dc-nav-brand" style={{ textDecoration: "none" }}>
          <img
            src="/assets/logo-dc-white.svg"
            alt=""
            width={32}
            height={26}
            className="dc-nav-logo"
            aria-hidden="true"
          />
          <span className="dc-nav-wordmark">DealCircle</span>
        </a>
        <div className="dc-footer-cols">
          {cols.map((c) => (
            <div key={c.h} className="dc-footer-col">
              <div className="dc-eyebrow">{c.h}</div>
              <ul>{c.l.map(([label, href]) => <li key={label}><a href={href}>{label}</a></li>)}</ul>
            </div>
          ))}
        </div>
      </div>
      <hr className="dc-divider" style={{ marginTop: "48px" }} />
      <div className="dc-footer-bottom">
        <span className="dc-micro dc-ink-muted">
          © 2026 PRO ASSETS GmbH · DealCircle Salzburg · Schloss Wiespach · Hallein
        </span>
        <span className="dc-micro dc-ink-muted">Zugang auf persönliche Empfehlung</span>
      </div>
    </footer>
  );
}
