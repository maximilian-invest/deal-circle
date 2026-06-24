"use client";
import { motion } from "framer-motion";

const wordVariants = {
  hidden: { y: 56, opacity: 0 },
  show: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: { duration: 0.9, delay: 0.15 + i * 0.12, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function Hero() {
  return (
    <section className="dc-hero" id="top">
      <div className="dc-hero-aura dc-hero-aura--violet" aria-hidden="true" />
      <div className="dc-hero-aura dc-hero-aura--magenta" aria-hidden="true" />

      <div className="dc-hero-content">
        <motion.div
          className="dc-eyebrow dc-hero-eyebrow"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        >
          Hallein · Schloss Wiespach · Salzburger Land
        </motion.div>

        <h1 className="dc-hero-title">
          <span className="dc-hero-line" style={{ display: "inline-block", overflow: "hidden" }}>
            <motion.span className="dc-word" custom={1} variants={wordVariants} initial="hidden" animate="show" style={{ display: "inline-block" }}>
              Deals,
            </motion.span>{" "}
            <motion.span className="dc-word" custom={2} variants={wordVariants} initial="hidden" animate="show" style={{ display: "inline-block" }}>
              Wissen,
            </motion.span>
          </span>
          <br />
          <span className="dc-hero-line" style={{ display: "inline-block", overflow: "hidden" }}>
            <motion.span className="dc-word" custom={3} variants={wordVariants} initial="hidden" animate="show" style={{ display: "inline-block" }}>
              Perspektiven.
            </motion.span>
          </span>
        </h1>

        <motion.p
          className="dc-hero-sub"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          DealCircle Salzburg ist ein Kreis aus Unternehmern, Investoren
          und Vortragenden — quer durch die Branchen. Sechs Mal im Jahr
          treffen wir uns auf Schloss Wiespach für Gespräche, die in offenen
          Formaten selten möglich sind. Wer etwas beizutragen hat, ist
          eingeladen sich zu melden.
        </motion.p>

        <motion.div
          className="dc-hero-cta"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
          <a href="#kontakt" className="dc-btn dc-btn-primary dc-btn--lg">Mitglied werden</a>
          <a href="#konzept" className="dc-btn dc-btn-secondary dc-btn--lg">Konzept ansehen</a>
        </motion.div>

        <motion.div
          className="dc-hero-meta"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
        >
          <span><strong>Top-Unternehmer</strong> aus dem DACH-Raum</span>
          <span className="dc-hero-rule" aria-hidden="true" />
          <span><strong>Exklusive Vorträge</strong> aus erster Hand</span>
          <span className="dc-hero-rule" aria-hidden="true" />
          <span>Zugang <strong>nur auf persönliche Empfehlung</strong></span>
        </motion.div>
      </div>
    </section>
  );
}
