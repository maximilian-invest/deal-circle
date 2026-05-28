export default function Werte() {
  const items = [
    { n: "01", h: "Substanz statt Show.", b: "Wir reden über Reales — nicht über Posen. Keine Pitches, keine PR.", color: "violet" },
    { n: "02", h: "Qualität vor Quantität.", b: "Bewusst kleine Runde, sorgfältig kuratiert. Weniger ist meistens mehr.", color: "magenta" },
    { n: "03", h: "Vertrauen, gehört.", b: "Was gesprochen wird, bleibt im Raum. Diskretion ist die Grundbedingung.", color: "orange" },
    { n: "04", h: "Lange Linien.", b: "Beziehungen, die über Jahre tragen — nicht über einen Abend.", color: "coral" },
  ];
  return (
    <section className="dc-section dc-section--tight" id="werte">
      <div className="dc-section-head dc-reveal">
        <div className="dc-eyebrow">Werte</div>
        <h2 className="dc-section-title">Wofür wir stehen.</h2>
      </div>
      <div className="dc-werte">
        {items.map((it, i) => (
          <div
            key={it.n}
            className="dc-werte-cell dc-reveal"
            data-delay={Math.min(i, 3) + ""}
            data-color={it.color}
          >
            <div className="dc-werte-blob" aria-hidden="true" />
            <span className="dc-werte-num">{it.n}</span>
            <h3 className="dc-werte-head">{it.h}</h3>
            <p className="dc-werte-body">{it.b}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
