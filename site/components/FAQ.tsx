"use client";
import { useState } from "react";

export default function FAQ() {
  const [open, setOpen] = useState(0);
  const rows = [
    {
      q: "Wie wird man Mitglied?",
      a: "Ausschließlich auf persönliche Empfehlung. Ein bestehendes Mitglied schlägt einen neuen Namen vor, wir führen ein erstes Gespräch, und am Ende entscheidet die Runde gemeinsam. Es gibt keine Bewerbung im klassischen Sinn — aber das Formular unten ist der richtige erste Schritt, wenn Sie bereits über eine Empfehlung sprechen.",
    },
    {
      q: "Was passiert bei einem typischen Treffen?",
      a: "Ein Abend auf Schloss Wiespach. Empfang, gemeinsames Dinner, ein bis zwei kurze Beiträge — und viel Raum für unstrukturiertes Gespräch. Keine Tagung, keine Bühne, kein straffes Programm.",
    },
    {
      q: "Wer spricht bei den Treffen?",
      a: "Vortragende sind Mitglieder oder eingeladene Gäste mit einer Geschichte, die Substanz hat: ein konkreter Deal, ein gelerntes Mindset, eine Investmentgelegenheit. Bekannte Persönlichkeiten aus Wirtschaft, Finanzen und Medien sind regelmäßig dabei — als Gast, nicht als Marke.",
    },
    {
      q: "Werden Inhalte aufgezeichnet oder veröffentlicht?",
      a: "Nein. Es gibt keine Aufzeichnung, keinen Live-Stream und keine öffentliche Berichterstattung. Vertraulichkeit ist die Voraussetzung dafür, dass die Gespräche überhaupt geführt werden können.",
    },
    {
      q: "Was kostet die Mitgliedschaft?",
      a: "Wir besprechen Konditionen im persönlichen Gespräch. Die Beiträge decken Location, Catering und die Kuration des Kreises — kein Modell mit Renditeerwartung.",
    },
    {
      q: "Wo finden die Treffen statt?",
      a: "Hauptlocation ist Schloss Wiespach in Hallein, im Salzburger Land. Die zwei großen Events des Jahres können an einem ausgewählten zweiten Ort stattfinden, der zum Charakter passt.",
    },
    {
      q: "Wie groß ist die Runde?",
      a: "Bewusst klein. Klein genug, dass jeder zu Wort kommt — groß genug, dass jedes Treffen neue Perspektiven bringt.",
    },
  ];
  return (
    <section className="dc-section" id="faq">
      <div className="dc-section-head dc-reveal">
        <div className="dc-eyebrow">Häufige Fragen</div>
        <h2 className="dc-section-title">Die ehrlichen Antworten.</h2>
      </div>
      <div className="dc-faq">
        {rows.map((r, i) => {
          const isOpen = open === i;
          return (
            <div
              key={i}
              className="dc-faq-row dc-reveal"
              data-delay={Math.min(i, 4) + ""}
              data-open={isOpen ? "true" : "false"}
              onClick={() => setOpen(isOpen ? -1 : i)}
              role="button"
              aria-expanded={isOpen}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpen(isOpen ? -1 : i);
                }
              }}
            >
              <div className="dc-faq-q">
                <span>{r.q}</span>
                <span className="dc-faq-toggle" aria-hidden="true">+</span>
              </div>
              <div className="dc-faq-a-wrap">
                <div className="dc-faq-a-inner">
                  <p className="dc-faq-a">{r.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
