"use client";
import { motion } from "framer-motion";
import AuthBadge from "./AuthBadge";
import type { Speaker, Ticket, TimelineItem } from "../components/member/types";

export type EventDetail = {
  id: number;
  title: string;
  starts_at: string;
  location: string;
  status: "open" | "limited" | "waitlist" | "closed";
  fee_cents: number;
  max_attendees: number | null;
  description: string | null;
  cover_path: string | null;
  timeline: TimelineItem[];
  speakers: Speaker[];
  tickets: Ticket[];
};

const MONTH_SHORT = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const WEEKDAY_LONG = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

function pad(n: number) { return String(n).padStart(2, "0"); }

function locationCity(loc: string): string {
  // "Schloss Wiespach, Hallein" → "Hallein", oder "St. Wolfgang am Wolfgangsee" → "St. Wolfgang am Wolfgangsee"
  const parts = loc.split(",").map((s) => s.trim()).filter(Boolean);
  return parts[parts.length - 1] || loc;
}

function locationVenue(loc: string): string {
  const parts = loc.split(",").map((s) => s.trim()).filter(Boolean);
  return parts[0] || loc;
}

export default function EventLanding({ event }: { event: EventDetail }) {
  const d = new Date(event.starts_at);
  // Headline-Preis: bei mehreren Tickets das günstigste, sonst fee_cents
  const headlineCents = event.tickets.length > 0
    ? Math.min(...event.tickets.map((t) => t.price_cents))
    : event.fee_cents;
  const fee = Math.round(headlineCents / 100);
  const feeLabel = `${fee.toLocaleString("de-AT")} €`;
  const hasMultiTickets = event.tickets.length > 1;

  const dayShort = `${d.getDate()}. ${MONTH_SHORT[d.getMonth()]}`;
  const yearWeekday = `${d.getFullYear()} · ${WEEKDAY_LONG[d.getDay()]}`;
  const timeHHMM = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const city = locationCity(event.location);
  const venue = locationVenue(event.location);

  // Marquee-Tokens
  const speakerNames = event.speakers.map((s) => s.name).slice(0, 4);
  const marqueeTokens = [
    "Deal Circle Event",
    `${d.getDate()}. ${["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"][d.getMonth()]} ${d.getFullYear()}`,
    city,
    ...speakerNames,
    `${fee} €`,
  ];
  const marqueeRow = marqueeTokens.join("  ·  ");

  // Lede: nimm Beschreibung wenn vorhanden, sonst Fallback
  const lede = event.description?.split("\n")[0]
    ?? "Verbinde dich mit Top-Unternehmern aus Österreich & Deutschland.";

  // Status-Tag
  const statusLabel =
    event.status === "waitlist" ? "Warteliste · " :
    event.status === "limited"  ? "Wenige Plätze · " :
    event.status === "closed"   ? "Ausgebucht · " :
                                  "Limitierte Plätze · ";

  return (
    <div className="dc-ev">
      <header className="dc-ev-nav">
        <div className="dc-ev-wrap dc-ev-nav-in">
          <a href="/" className="dc-ev-brand" aria-label="DealCircle">
            <img src="/assets/logo-dc-white.svg" alt="" width={32} height={26} aria-hidden="true" />
            <span>DealCircle</span>
          </a>
          <div className="dc-ev-nav-right">
            <AuthBadge variant="dark" />
            {event.status !== "closed" && (
              <a className="dc-ev-nav-cta" href="#ticket">
                <b>{hasMultiTickets ? `Ab ${feeLabel}` : feeLabel}</b> · Platz sichern
              </a>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="dc-ev-hero">
          <div className="dc-ev-wrap dc-ev-hero-content">
            <span className="dc-ev-tag">
              <i aria-hidden="true" />
              {statusLabel}{city}
            </span>
            <motion.h1
              className="dc-ev-hero-title"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              {event.title}
            </motion.h1>

            <motion.div
              className="dc-ev-hero-stage"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="dc-ev-hero-photo">
                <img src={event.cover_path || "/impressions/01-terrasse.jpg"} alt="" />
              </div>
              {event.status !== "closed" && (
                <div className="dc-ev-price-chip" aria-hidden="true">
                  <div className="dc-ev-price-chip-k">{hasMultiTickets ? "Ab" : "Ticket"}</div>
                  <div className="dc-ev-price-chip-v">{feeLabel}</div>
                  <div className="dc-ev-price-chip-n">pro Person · inkl. Dinner</div>
                </div>
              )}
            </motion.div>

            <motion.p
              className="dc-ev-hero-lede dc-ev-grad"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {lede}
            </motion.p>
            <motion.div
              className="dc-ev-hero-actions"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {event.status !== "closed" ? (
                <a className="dc-ev-btn-primary" href="#ticket">
                  Ticket sichern
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </a>
              ) : (
                <span className="dc-ev-price-inline">Dieses Event ist bereits vorbei.</span>
              )}
            </motion.div>

            <motion.div
              className="dc-ev-facts"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="dc-ev-fact">
                <div className="dc-ev-fact-v">{dayShort}</div>
                <div className="dc-ev-fact-k">{yearWeekday}</div>
              </div>
              <div className="dc-ev-fact">
                <div className="dc-ev-fact-v">{timeHHMM}</div>
                <div className="dc-ev-fact-k">Einlass & Aperitif</div>
              </div>
              <div className="dc-ev-fact">
                <div className="dc-ev-fact-v">{venue}</div>
                <div className="dc-ev-fact-k">{city}</div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* MARQUEE */}
        <div className="dc-ev-marquee" aria-hidden="true">
          <div className="dc-ev-marquee-track">
            <span>{marqueeRow}</span>
            <span>{marqueeRow}</span>
          </div>
        </div>

        {/* PROGRAMM */}
        {event.timeline.length > 0 && (
          <section id="programm" className="dc-ev-section">
            <div className="dc-ev-wrap">
              <div className="dc-ev-sec-head">
                <span className="dc-ev-sec-num dc-ev-grad">01</span>
                <span className="dc-ev-sec-label">Programm</span>
              </div>
              <h2 className="dc-ev-sec-title">Event Timeline</h2>

              <div className="dc-ev-agenda">
                {event.timeline.map((item, i) => (
                  <motion.div
                    key={item.id ?? i}
                    className="dc-ev-ag-row"
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-10%" }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                  >
                    <span className="dc-ev-ag-num dc-ev-grad">{pad(i + 1)}</span>
                    <span className="dc-ev-ag-time">{item.time_label}</span>
                    <div className="dc-ev-ag-body">
                      <div className="dc-ev-ag-t">{item.label}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SPEAKER */}
        {event.speakers.length > 0 && (
          <section id="speaker" className="dc-ev-section">
            <div className="dc-ev-wrap">
              <div className="dc-ev-sec-head">
                <span className="dc-ev-sec-num dc-ev-grad">{event.timeline.length > 0 ? "02" : "01"}</span>
                <span className="dc-ev-sec-label">Speaker</span>
              </div>
              <h2 className="dc-ev-sec-title">
                {event.speakers.length === 1 ? "Stimme, die liefert." : "Stimmen, die liefern."}
              </h2>

              <div className={`dc-ev-speakers dc-ev-speakers--${event.speakers.length === 1 ? "one" : "many"}`}>
                {event.speakers.map((sp, i) => (
                  <motion.div
                    key={sp.id ?? i}
                    className="dc-ev-sp-card"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-10%" }}
                    transition={{ duration: 0.6, delay: i * 0.08 }}
                  >
                    <div className="dc-ev-sp-photo">
                      {sp.photo_path ? (
                        <img src={sp.photo_path} alt={`Foto ${sp.name}`} loading="lazy" />
                      ) : (
                        <div className="dc-ev-sp-photo-empty" aria-label={`Foto folgt: ${sp.name}`}>
                          {sp.name.split(/\s+/).map((s) => s[0]?.toUpperCase() ?? "").join("").slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <div className="dc-ev-sp-meta">
                      <div className="dc-ev-sp-name">{sp.name}</div>
                    </div>
                    {sp.bio && <p className="dc-ev-sp-bio">{sp.bio}</p>}
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* TICKETS */}
        {event.status !== "closed" && (
          <section id="ticket" className="dc-ev-section">
            <div className="dc-ev-wrap">
              <div className="dc-ev-sec-head">
                <span className="dc-ev-sec-num dc-ev-grad">
                  {pad(1 + (event.timeline.length > 0 ? 1 : 0) + (event.speakers.length > 0 ? 1 : 0))}
                </span>
                <span className="dc-ev-sec-label">Ticket{event.tickets.length > 1 ? "s" : ""}</span>
              </div>
              <h2 className="dc-ev-sec-title" style={{ marginBottom: "48px" }}>
                {event.tickets.length > 1 ? "Wähle deinen Platz." : "Sichere dir deinen Platz."}
              </h2>

              {event.tickets.length > 0 ? (
                <div className="dc-ev-tickets" data-count={Math.min(event.tickets.length, 3)}>
                  {event.tickets.map((t, i) => {
                    const price = `${Math.round(t.price_cents / 100).toLocaleString("de-AT")} €`;
                    return (
                      <motion.div
                        key={t.id ?? i}
                        className={`dc-ev-tier${t.featured ? " is-featured" : ""}`}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-10%" }}
                        transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {t.badge && <span className="dc-ev-tier-badge">{t.badge}</span>}
                        <div className="dc-ev-tier-name">{t.name}</div>
                        <div className="dc-ev-tier-price">{price}</div>
                        <div className="dc-ev-tier-sub">pro Person · inkl. Dinner und Getränke</div>
                        <ul className="dc-ev-tier-incl">
                          {t.perks.map((p, pi) => (
                            <li key={pi}><Check />{p}</li>
                          ))}
                        </ul>
                        <a className={`dc-ev-btn-tier ${t.featured ? "is-dark" : "is-light"}`}
                           href="/mitglieder/login/">
                          {t.featured ? `${t.name}-Platz sichern` : "Platz sichern"}
                        </a>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                // Fallback: einzelnes Ticket aus fee_cents wenn admin keine Tickets pflegt
                <motion.div
                  className="dc-ev-ticket-card is-featured dc-ev-ticket-card--solo"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="dc-ev-ticket-card-head">
                    <div className="dc-ev-ticket-k">Ticket</div>
                    <div className="dc-ev-ticket-price">
                      {feeLabel}
                      <small>pro Person · inkl. Dinner und Getränke</small>
                    </div>
                  </div>
                  <ul className="dc-ev-incl">
                    {event.speakers.length > 0 && (
                      <li><Check />Zugang zu {event.speakers.length === 1 ? "der Keynote" : `${event.speakers.length} Keynotes`}</li>
                    )}
                    <li><Check />Mehrgang-Dinner & Getränke</li>
                    <li><Check />Kuratiertes Networking</li>
                    {event.max_attendees && (
                      <li><Check />Limitiert auf {event.max_attendees} Plätze</li>
                    )}
                  </ul>
                  <a className="dc-ev-btn-dark" href="/mitglieder/login/">
                    Ticket für {feeLabel} kaufen
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </a>
                  <p className="dc-ev-ticket-note">Sichere Zahlung · Bestätigung per E-Mail</p>
                </motion.div>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="dc-ev-footer">
        <div className="dc-ev-wrap dc-ev-foot-in">
          <div className="dc-ev-foot-dots">
            DealCircle Salzburg · Salzburg · Wien · München · Zürich
          </div>
          <nav className="dc-ev-foot-links">
            <a href="/#impressum">Impressum</a>
            <a href="/#datenschutz">Datenschutz</a>
            <a href="#ticket">Tickets</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function Check() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
