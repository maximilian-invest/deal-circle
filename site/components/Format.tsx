export default function Format() {
  return (
    <section className="dc-section" id="format">
      <div className="dc-section-head dc-reveal">
        <div className="dc-eyebrow">Format &amp; Ablauf</div>
        <h2 className="dc-section-title">Sechs Treffen, zwei Events,<br />ein Schloss.</h2>
      </div>

      <div className="dc-format-grid">
        <div className="dc-format-image dc-reveal">
          <img
            src="/impressions/schloss-wiespach.jpg"
            alt="Schloss Wiespach in Hallein — gelbe Barockfassade mit festlich gedeckter Tafel im Garten."
            className="dc-format-image-photo"
            loading="lazy"
          />
          <div className="dc-format-image-scrim" aria-hidden="true" />
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
