export default function Format() {
  return (
    <section className="dc-section" id="format">
      <div className="dc-section-head dc-reveal">
        <div className="dc-eyebrow">Format &amp; Ablauf</div>
        <h2 className="dc-section-title">Sechs Treffen, zwei Events,<br />ein Schloss.</h2>
      </div>

      <div className="dc-format-grid">
        <div className="dc-format-image dc-reveal">
          <SchlossPlaceholder />
          <span className="dc-format-image-placeholder">Foto Schloss Wiespach folgt</span>
          <div className="dc-format-image-label">
            <span className="dc-eyebrow dc-tile-eyebrow-on-grad">Hauptlocation</span>
            <span className="dc-headline" style={{ color: "#fff", letterSpacing: "-0.6px" }}>
              Schloss Wiespach
            </span>
            <span className="dc-caption">Hallein · Salzburger Land</span>
          </div>
        </div>

        <div className="dc-format-list dc-reveal" data-delay="1">
          <div className="dc-format-row">
            <span className="dc-format-row-num">01</span>
            <div>
              <h3 className="dc-format-row-head">Treffen alle zwei Monate</h3>
              <p className="dc-format-row-body">
                Sechs Mal im Jahr kommen wir auf Schloss Wiespach zusammen. Ein
                Abend, ein Gastgeber, ein bis zwei kurze Beiträge — und viel
                Raum für persönliches Gespräch.
              </p>
            </div>
          </div>

          <div className="dc-format-row">
            <span className="dc-format-row-num">02</span>
            <div>
              <h3 className="dc-format-row-head">Zwei große Events im Jahr</h3>
              <p className="dc-format-row-body">
                Zwei Mal jährlich erweitern wir den Kreis: ein Sommerformat und
                ein Jahresabschluss mit ausgewählten Gästen, längeren Beiträgen
                und gemeinsamem Dinner.
              </p>
            </div>
          </div>

          <div className="dc-format-row">
            <span className="dc-format-row-num">03</span>
            <div>
              <h3 className="dc-format-row-head">Kuratierter Kreis</h3>
              <p className="dc-format-row-body">
                Bewusst klein gehalten. Jede Einladung wird persönlich
                ausgesprochen — von einem bestehenden Mitglied, das für die
                Person bürgt.
              </p>
            </div>
          </div>

          <div className="dc-format-row">
            <span className="dc-format-row-num">04</span>
            <div>
              <h3 className="dc-format-row-head">Vertrauliche Atmosphäre</h3>
              <p className="dc-format-row-body">
                Was gesprochen wird, bleibt im Raum. Keine Aufzeichnung, keine
                Veröffentlichung, kein Live-Stream — die Voraussetzung dafür,
                dass die Gespräche überhaupt geführt werden können.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SchlossPlaceholder() {
  return (
    <svg
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1F1F22" />
          <stop offset="1" stopColor="#0A0A0B" />
        </linearGradient>
        <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#161618" />
          <stop offset="1" stopColor="#0A0A0B" />
        </linearGradient>
        <pattern id="grain" x="0" y="0" width="2" height="2" patternUnits="userSpaceOnUse">
          <rect width="2" height="2" fill="rgba(255,255,255,0.012)" />
        </pattern>
        <radialGradient id="vign" cx="0.5" cy="0.45" r="0.8">
          <stop offset="0.6" stopColor="rgba(0,0,0,0)" />
          <stop offset="1" stopColor="rgba(0,0,0,0.55)" />
        </radialGradient>
      </defs>
      <rect width="800" height="600" fill="url(#sky)" />
      <path d="M0,360 L120,310 L240,340 L360,290 L500,330 L640,300 L800,340 L800,600 L0,600 Z" fill="url(#hill)" opacity="0.85" />
      <g fill="#1F1F22" stroke="rgba(255,255,255,0.06)" strokeWidth="1">
        <rect x="280" y="330" width="240" height="120" />
        <rect x="240" y="280" width="60" height="170" />
        <polygon points="240,280 270,240 300,280" />
        <rect x="500" y="270" width="60" height="180" />
        <polygon points="500,270 530,225 560,270" />
        <rect x="380" y="290" width="50" height="60" />
        <polygon points="380,290 405,260 430,290" />
      </g>
      <g fill="rgba(255,200,140,0.22)">
        <rect x="252" y="305" width="8" height="12" />
        <rect x="280" y="305" width="8" height="12" />
        <rect x="300" y="355" width="10" height="16" />
        <rect x="330" y="355" width="10" height="16" />
        <rect x="360" y="355" width="10" height="16" />
        <rect x="430" y="355" width="10" height="16" />
        <rect x="460" y="355" width="10" height="16" />
        <rect x="490" y="355" width="10" height="16" />
        <rect x="512" y="295" width="8" height="12" />
        <rect x="540" y="295" width="8" height="12" />
      </g>
      <path d="M0,450 L60,440 L120,450 L200,430 L320,455 L460,440 L600,455 L720,440 L800,455 L800,600 L0,600 Z" fill="#0A0A0B" />
      <rect width="800" height="600" fill="url(#grain)" />
      <rect width="800" height="600" fill="url(#vign)" />
    </svg>
  );
}
