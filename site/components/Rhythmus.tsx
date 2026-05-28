export default function Rhythmus() {
  const months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  const treffen = [1, 5, 9, 11];
  const events: Record<number, { label: string; color: "violet" | "orange" }> = {
    3: { label: "Frühjahrsevent", color: "orange" },
    7: { label: "Sommerevent", color: "violet" },
  };

  return (
    <section className="dc-section" id="rhythmus">
      <div className="dc-section-head dc-reveal">
        <div className="dc-eyebrow">Im Rhythmus</div>
        <h2 className="dc-section-title">Ein Jahr,<br />klar getaktet.</h2>
        <p className="dc-body-lg dc-ink-muted" style={{ maxWidth: "560px", margin: "8px 0 0" }}>
          Sechs Treffen verteilen sich gleichmäßig über das Jahr. Zwei davon
          wachsen zu Events — ein Sommerformat und ein Jahresabschluss.
        </p>
      </div>

      <div className="dc-year-bar dc-reveal">
        <div className="dc-year-line" aria-hidden="true" />

        <div className="dc-year-track">
          {months.map((m, i) => {
            const event = events[i];
            const isTreffen = treffen.includes(i);
            const active = !!event || isTreffen;
            return (
              <div
                key={i}
                className="dc-year-cell"
                data-active={active ? "true" : "false"}
                style={{ ["--i" as string]: i } as React.CSSProperties}
              >
                <div className="dc-year-marker">
                  {event ? (
                    <div className={"dc-year-event dc-year-event--" + event.color}>
                      <span className="dc-year-event-dot" aria-hidden="true" />
                      {event.label}
                    </div>
                  ) : isTreffen ? (
                    <span className="dc-year-dot" aria-hidden="true" />
                  ) : null}
                </div>
                <span className="dc-year-month">{m}</span>
              </div>
            );
          })}
        </div>

        <div className="dc-year-legend">
          <span className="dc-year-legend-item">
            <span className="dc-year-dot" aria-hidden="true" />
            Treffen auf Schloss Wiespach
          </span>
          <span className="dc-year-legend-item">
            <span className="dc-year-legend-pill dc-spotlight-orange" aria-hidden="true" />
            <span className="dc-year-legend-pill dc-spotlight-violet" aria-hidden="true" />
            Großes Event
          </span>
        </div>
      </div>
    </section>
  );
}
