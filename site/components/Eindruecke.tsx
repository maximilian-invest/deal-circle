"use client";
import { motion } from "framer-motion";

type Pic = {
  src: string;
  alt: string;
  caption: string;
  area: "hero" | "detail-a" | "detail-b" | "social-a" | "social-b";
};

const PICS: Pic[] = [
  {
    src:  "/impressions/01-terrasse.jpg",
    alt:  "Pascal Grebien am Sommerabend im Garten von Schloss Wiespach mit einem Aperitif.",
    caption: "Empfang im Garten.",
    area: "hero",
  },
  {
    src:  "/impressions/02-wappen.jpg",
    alt:  "Wappenstein am Schloss Wiespach mit der Jahreszahl 1878 und einer Rose.",
    caption: "Wiespach · 1878.",
    area: "detail-a",
  },
  {
    src:  "/impressions/03-fassade.jpg",
    alt:  "Die gelbe Fassade von Schloss Wiespach mit Turm im Gegenlicht.",
    caption: "Schloss Wiespach.",
    area: "detail-b",
  },
  {
    src:  "/impressions/04-foyer.jpg",
    alt:  "Mitglieder im Gespräch an der Bar im Foyer.",
    caption: "Im Foyer.",
    area: "social-a",
  },
  {
    src:  "/impressions/05-hof.jpg",
    alt:  "Drei Mitglieder im Gespräch im Innenhof vor dem Eingang.",
    caption: "Innenhof.",
    area: "social-b",
  },
];

export default function Eindruecke() {
  return (
    <section className="dc-section dc-eindruecke" id="eindruecke">
      <div className="dc-section-head dc-reveal">
        <div className="dc-eyebrow">Eindrücke</div>
        <h2 className="dc-section-title">Wie es bei uns aussieht.</h2>
        <p className="dc-section-lede">
          Auszug aus den letzten Treffen. Schloss Wiespach, Hallein — historisches
          Setting, gehobene Atmosphäre, kleine Runden. Keine Inszenierung, keine
          Pressefotos.
        </p>
      </div>

      <div className="dc-eindruecke-grid">
        {PICS.map((p, i) => (
          <motion.figure
            key={p.src}
            className={`dc-eindruecke-tile dc-eindruecke-tile--${p.area}`}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6, delay: i * 0.06, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <img
              src={p.src}
              alt={p.alt}
              loading="lazy"
              decoding="async"
              className="dc-eindruecke-img"
            />
            <figcaption className="dc-eindruecke-caption">{p.caption}</figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}
