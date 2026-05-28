"use client";
import { motion } from "framer-motion";

export default function Konzept() {
  return (
    <section className="dc-section" id="konzept">
      <div className="dc-section-head dc-reveal">
        <div className="dc-eyebrow">Konzept</div>
        <h2 className="dc-section-title">Ein kuratierter Kreis.<br />Kein Publikum.</h2>
      </div>

      <div className="dc-konzept-grid">
        <motion.div
          className="dc-spotlight dc-spotlight-violet dc-tile-wide dc-reveal"
          whileHover={{ y: -4 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="dc-eyebrow dc-tile-eyebrow-on-grad">Was uns trägt</div>
          <div>
            <h3 className="dc-tile-title">Substanz<br />statt Show.</h3>
            <p className="dc-tile-body">
              Wir teilen, was selten geteilt wird: konkrete Deals, gelernte
              Lektionen, persönliche Perspektiven. In einer Runde, die klein
              genug ist, dass jeder zu Wort kommt — und groß genug, dass jedes
              Treffen etwas Neues bringt.
            </p>
          </div>
        </motion.div>

        <motion.div
          className="dc-card dc-tile dc-reveal"
          data-delay="1"
          whileHover={{ y: -3 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="dc-eyebrow">Im Inneren</div>
          <h3 className="dc-tile-title-sm">Persönlich und nahbar.</h3>
          <p className="dc-tile-body">
            Vortragende, Mitglieder und Gäste sitzen am selben Tisch. Keine
            Bühne, kein Publikum — ein Gespräch unter Gleichgesinnten, das
            gemeinsam getragen wird.
          </p>
        </motion.div>

        <motion.div
          className="dc-card dc-tile dc-reveal"
          data-delay="2"
          whileHover={{ y: -3 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="dc-eyebrow">Nach außen</div>
          <h3 className="dc-tile-title-sm">Zurückhaltend.</h3>
          <p className="dc-tile-body">
            Was im Raum besprochen wird, bleibt im Raum. Wir sind ein
            ernsthaftes Netzwerk mit klarem Fokus — kein Geheimzirkel, aber
            auch keine Konferenzbühne.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
