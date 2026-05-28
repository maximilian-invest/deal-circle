export default function Mitglieder() {
  const cards = [
    {
      n: "01",
      h: "Unternehmer",
      b: "Inhabergeführte Unternehmen mit echter Substanz — vom mittelständischen Familienbetrieb bis zum gewachsenen Tech-Unternehmen.",
    },
    {
      n: "02",
      h: "Investoren",
      b: "Private und institutionelle Investoren, Family Offices und Beteiligungsgesellschaften aus dem deutschsprachigen Raum.",
    },
    {
      n: "03",
      h: "Vermögende Privatpersonen",
      b: "Menschen, die bereits gebaut, verkauft oder geerbt haben — und ihr Kapital mit Sorgfalt einsetzen.",
    },
    {
      n: "04",
      h: "Vortragende",
      b: "Bekannte Persönlichkeiten aus Wirtschaft, Finanzen und Medien, die ihre Erfahrungen offen teilen — als Gast, nicht als Marke.",
    },
  ];

  return (
    <section className="dc-section" id="mitglieder">
      <div className="dc-section-head dc-reveal">
        <div className="dc-eyebrow">Wer dabei ist</div>
        <h2 className="dc-section-title">Eine Runde,<br />die einander kennt.</h2>
        <p className="dc-body-lg dc-ink-muted" style={{ maxWidth: "640px", margin: "8px 0 0" }}>
          Der Kreis ist bewusst gemischt. Was alle teilen: unternehmerische
          Verantwortung, gelebte Erfahrung und das Interesse an ehrlichem
          Austausch jenseits der Konferenzbühne.
        </p>
      </div>

      <div className="dc-mitglieder">
        {cards.map((c, i) => (
          <div key={c.n} className="dc-mitglieder-card dc-reveal" data-delay={Math.min(i, 3) + ""}>
            <div className="dc-mitglieder-card-head">
              <span>{c.h}</span>
              <span className="dc-mitglieder-num">{c.n}</span>
            </div>
            <p className="dc-mitglieder-card-body">{c.b}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
