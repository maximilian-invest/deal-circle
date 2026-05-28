export default function Footer() {
  const cols: { h: string; l: [string, string][] }[] = [
    { h: "Konzept", l: [["Was ist DealCircle", "#konzept"], ["Format & Ablauf", "#format"], ["Mitglieder", "#mitglieder"], ["Werte", "#werte"]] },
    { h: "Kontakt", l: [["Mitglied werden", "#kontakt"], ["salzburg@deal-circle.at", "mailto:salzburg@deal-circle.at"], ["FAQ", "#faq"]] },
    { h: "Standort", l: [["Schloss Wiespach", "#"], ["Hallein", "#"], ["Salzburger Land", "#"]] },
    { h: "Rechtliches", l: [["Impressum", "#impressum"], ["Datenschutz", "#datenschutz"], ["AGB", "#agb"]] },
  ];
  return (
    <footer className="dc-footer">
      <div className="dc-footer-top">
        <a href="#top" className="dc-nav-brand" style={{ textDecoration: "none" }}>
          <svg width="26" height="26" viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="14" fill="none" stroke="#fff" strokeWidth="2.4" />
            <circle cx="20" cy="20" r="4.2" fill="#fff" />
          </svg>
          <span className="dc-nav-wordmark">DealCircle</span>
          <span className="dc-nav-tag">Salzburg</span>
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
          © 2026 DealCircle Salzburg · Schloss Wiespach · Hallein · Salzburger Land
        </span>
        <span className="dc-micro dc-ink-muted">Zugang auf persönliche Empfehlung</span>
      </div>
    </footer>
  );
}
