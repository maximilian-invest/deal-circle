"use client";
import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import AuthBadge from "./AuthBadge";
import Footer from "./Footer";
import { fetchMe, logout, type AuthUser } from "./member/auth";
import { registerForEvent, startCheckout, startGuestCheckout } from "./member/events";
import type { Speaker, Ticket, TimelineItem } from "./member/types";

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
  member_discount_pct: number;
  timeline: TimelineItem[];
  speakers: Speaker[];
  tickets: Ticket[];
};

const MONTH_SHORT = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const WEEKDAY_LONG = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

function pad(n: number) { return String(n).padStart(2, "0"); }
function euro(cents: number): string { return `${Math.round(cents / 100).toLocaleString("de-AT")} €`; }

// Preis-Ausweisung — erscheint überall, wo ein Event-Preis steht.
const PRICE_NOTE = "exkl. MwSt. · exkl. Getränke · inkl. Dinner & Aperitif";
function memberCents(regularCents: number, pct: number): number {
  return Math.round((regularCents * (100 - pct)) / 100);
}

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
  const pct = event.member_discount_pct ?? 0;

  // Auth-Status + Registration-Status
  const [me, setMe] = useState<AuthUser | null | "loading">("loading");
  const [registered, setRegistered] = useState<boolean>(false);
  const [paid, setPaid] = useState<boolean>(false);
  const [registering, setRegistering] = useState<number | "default" | null>(null);
  const [regError, setRegError] = useState<string | null>(null);
  // Gast-Reservierung (ohne Login) für öffentliche Events
  const [guestFor, setGuestFor] = useState<{ ticketId: number | null; cents: number; label: string } | null>(null);
  const [guestDone, setGuestDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Stripe-Rückkehr: ?paid=… → bezahlt, ?cancelled=1 → abgebrochen
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("paid")) { setPaid(true); setRegistered(true); }
      if (params.get("cancelled")) setRegError("Zahlung abgebrochen. Du kannst es jederzeit erneut versuchen.");
    }

    fetchMe().then((u) => {
      if (cancelled) return;
      setMe(u);
      if (u) {
        // schauen ob ich fuer dieses Event schon angemeldet bin
        fetch("/api/events/me/registrations", {
          headers: { Authorization: `Bearer ${sessionStorage.getItem("dc-token") || ""}` },
        }).then(r => r.ok ? r.json() : null).then((data) => {
          if (cancelled || !data) return;
          const reg = (data.registrations || []).find(
            (r: { event_id: number; status: string }) =>
              r.event_id === event.id && r.status !== "cancelled"
          );
          if (reg) {
            setRegistered(true);
            if (reg.status === "paid") setPaid(true);
          }
        });
      }
    });
    return () => { cancelled = true; };
  }, [event.id]);

  // Warteliste-Events: nur eintragen, keine Zahlung
  const isWaitlist = event.status === "waitlist";

  // Stripe-Checkout starten (für eingeloggte Mitglieder)
  const doPay = async () => {
    setRegError(null);
    try {
      const r = await startCheckout(event.id);
      if (r.free && r.redirect) {
        window.location.href = r.redirect;
      } else if (r.checkout_url) {
        window.location.href = r.checkout_url;
      } else {
        setRegError("Zahlung konnte nicht gestartet werden.");
      }
    } catch (err) {
      setRegError(err instanceof Error ? err.message : "Zahlung fehlgeschlagen.");
    }
  };

  // Gast-Kauf (ohne Login): bezahlte Tickets gehen direkt zu Stripe (E-Mail wird
  // dort erfasst); Gratis-Tickets brauchen kurz Name + E-Mail über das Formular.
  const doGuestBuy = async (ticketId: number | null, cents: number, label: string) => {
    setRegError(null);
    if (cents <= 0) { setGuestFor({ ticketId, cents, label }); return; }
    try {
      const r = await startGuestCheckout(event.id, { ticket_id: ticketId });
      if (r.checkout_url) { window.location.href = r.checkout_url; return; }
      if (r.free && r.redirect) { window.location.href = r.redirect; return; }
      setRegError("Zahlung konnte nicht gestartet werden.");
    } catch (err) {
      setRegError(err instanceof Error ? err.message : "Zahlung fehlgeschlagen.");
    }
  };

  const doRegister = async (ticketId?: number) => {
    if (!me || me === "loading") return;
    setRegistering(ticketId ?? "default");
    setRegError(null);
    try {
      await registerForEvent(event.id, ticketId ?? null);
      setRegistered(true);
      // Warteliste = keine Zahlung, sonst direkt zu Stripe
      if (!isWaitlist) {
        await doPay();
        return;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Bereits angemeldet? Direkt zu Stripe.
      if (/already_registered/i.test(msg) && !isWaitlist) {
        setRegistered(true);
        await doPay();
        return;
      }
      setRegError(msg || "Anmeldung fehlgeschlagen.");
    } finally {
      setRegistering(null);
    }
  };

  // Eingeloggt = Mitgliederpreis; anonym = regulärer Preis + Hinweis-Badge.
  const isMember = me !== null && me !== "loading";
  const anon = me === null;

  const dayShort = `${d.getDate()}. ${MONTH_SHORT[d.getMonth()]}`;
  const yearWeekday = `${d.getFullYear()} · ${WEEKDAY_LONG[d.getDay()]}`;
  const timeHHMM = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const city = locationCity(event.location);
  const venue = locationVenue(event.location);

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
            {isMember && (
              <a
                className="dc-ev-nav-cta"
                href="/"
                onClick={(e) => { e.preventDefault(); logout(); window.location.reload(); }}
              >
                Logout
              </a>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="dc-ev-hero">
          <div className="dc-ev-wrap dc-ev-hero-content">
            <nav className="dc-ev-crumbs" aria-label="Brotkrumen">
              <a href="/" className="dc-ev-crumb-back">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Startseite
              </a>
              <span className="dc-ev-crumb-sep" aria-hidden="true">/</span>
              <span className="dc-ev-crumb-current">{event.title}</span>
            </nav>
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
                  <div className="dc-ev-price-chip-n">pro Person · exkl. MwSt.</div>
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

              {pct > 0 && anon && (
                <div className="dc-ev-memberbar">
                  <span className="dc-ev-memberbar-pct">−{pct}%</span>
                  <div className="dc-ev-memberbar-text">
                    <div className="dc-ev-memberbar-t">Als DealCircle-Mitglied {pct}% günstiger.</div>
                    <div className="dc-ev-memberbar-s">Mit dem monatlichen Abo sicherst du dir Spezialpreise auf alle Events.</div>
                  </div>
                  <a className="dc-ev-memberbar-cta" href="/mitglied-werden/">
                    Mitglied werden <Arrow />
                  </a>
                </div>
              )}

              {event.tickets.length > 0 ? (
                <div className="dc-ev-tickets" data-count={Math.min(event.tickets.length, 3)}>
                  {event.tickets.map((t, i) => {
                    const showCents = (pct > 0 && isMember) ? memberCents(t.price_cents, pct) : t.price_cents;
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
                        <div className="dc-ev-tier-price">{euro(showCents)}</div>
                        <MemberPriceMeta regularCents={t.price_cents} pct={pct} isMember={isMember} anon={anon} />
                        <div className="dc-ev-tier-sub">pro Person</div>
                        <div className="dc-ev-price-note">{PRICE_NOTE}</div>
                        <ul className="dc-ev-tier-incl">
                          {t.perks.map((p, pi) => (
                            <li key={pi}><Check />{p}</li>
                          ))}
                        </ul>
                        <TierCta
                          me={me}
                          registered={registered}
                          paid={paid}
                          isWaitlist={isWaitlist}
                          registering={registering === (t.id ?? -1)}
                          featured={t.featured}
                          name={t.name}
                          onRegister={() => doRegister(t.id ?? undefined)}
                          onPay={doPay}
                          guestDone={guestDone}
                          onGuest={() => doGuestBuy(t.id ?? null, t.price_cents, t.name)}
                        />
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
                      {euro((pct > 0 && isMember) ? memberCents(event.fee_cents, pct) : event.fee_cents)}
                      <small>pro Person</small>
                    </div>
                  </div>
                  <div className="dc-ev-price-note dc-ev-price-note--solo">{PRICE_NOTE}</div>
                  <MemberPriceMeta regularCents={event.fee_cents} pct={pct} isMember={isMember} anon={anon} />
                  <ul className="dc-ev-incl">
                    {event.speakers.length > 0 && (
                      <li><Check />Zugang zu {event.speakers.length === 1 ? "der Keynote" : `${event.speakers.length} Keynotes`}</li>
                    )}
                    <li><Check />Mehrgang-Dinner & Aperitif</li>
                    <li><Check />Kuratiertes Networking</li>
                    {event.max_attendees && (
                      <li><Check />Limitiert auf {event.max_attendees} Plätze</li>
                    )}
                  </ul>
                  <SoloCta
                    me={me}
                    registered={registered}
                    paid={paid}
                    isWaitlist={isWaitlist}
                    registering={registering === "default"}
                    feeLabel={feeLabel}
                    onRegister={() => doRegister()}
                    onPay={doPay}
                    guestDone={guestDone}
                    onGuest={() => doGuestBuy(null, event.fee_cents, "Ticket")}
                  />
                  {regError && <p className="dc-ev-ticket-note" style={{ color: "#FFB0B0" }}>{regError}</p>}
                  <p className="dc-ev-ticket-note">Sichere Zahlung · Bestätigung per E-Mail</p>
                </motion.div>
              )}
            </div>
          </section>
        )}
      </main>

      {guestFor && (
        <GuestForm
          eventId={event.id}
          ticketId={guestFor.ticketId}
          label={guestFor.label}
          cents={guestFor.cents}
          onClose={() => setGuestFor(null)}
          onDone={() => { setGuestDone(true); setGuestFor(null); }}
        />
      )}

      <Footer />
    </div>
  );
}

function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// Kleine Zeile unter dem Preis: eingeloggt → regulärer Preis durchgestrichen +
// "Mitgliederpreis"-Tag; anonym → Hinweis-Badge "−X% als Mitglied".
function MemberPriceMeta({ regularCents, pct, isMember, anon }: {
  regularCents: number; pct: number; isMember: boolean; anon: boolean;
}) {
  if (pct <= 0) return null;
  if (isMember) {
    return (
      <div className="dc-ev-price-meta">
        <span className="dc-ev-price-was">{euro(regularCents)}</span>
        <span className="dc-ev-price-tag">Mitgliederpreis · −{pct}%</span>
      </div>
    );
  }
  if (anon) {
    return (
      <div className="dc-ev-price-meta">
        <span className="dc-ev-price-hint">−{pct}% als DealCircle-Mitglied</span>
      </div>
    );
  }
  return null;
}

type CtaCommon = {
  me: AuthUser | null | "loading";
  registered: boolean;
  paid: boolean;
  isWaitlist: boolean;
  registering: boolean;
  guestDone: boolean;
  onGuest: () => void;
  onPay: () => void;
};

function TierCta({
  me, registered, paid, isWaitlist, registering, featured, name, onRegister, guestDone, onGuest, onPay,
}: CtaCommon & { featured: boolean; name: string; onRegister: () => void }) {
  const cls = `dc-ev-btn-tier ${featured ? "is-dark" : "is-light"}`;
  const label = featured ? `${name} kaufen` : "Ticket kaufen";
  if (me === "loading") return <button className={cls} disabled>…</button>;
  // Anonym = Gast-Reservierung (ohne Zahlung)
  if (me === null) {
    if (paid) return <span className={`${cls} is-registered`}>✓ Bezahlt</span>;
    if (guestDone) return <span className={`${cls} is-registered`}>✓ Reserviert</span>;
    return <button type="button" className={cls} onClick={onGuest}>{label}</button>;
  }
  if (paid) return <span className={`${cls} is-registered`}>✓ Bezahlt</span>;
  if (isWaitlist && registered) return <span className={`${cls} is-registered`}>✓ Auf Warteliste</span>;
  if (isWaitlist) return (
    <button type="button" className={cls} onClick={onRegister} disabled={registering}>
      {registering ? "Wird eingetragen …" : "Auf Warteliste setzen"}
    </button>
  );
  if (registered) return (
    <button type="button" className={cls} onClick={onPay} disabled={registering}>Jetzt bezahlen</button>
  );
  return (
    <button type="button" className={cls} onClick={onRegister} disabled={registering}>
      {registering ? "Wird weitergeleitet …" : (featured ? `${name} buchen` : "Platz sichern & bezahlen")}
    </button>
  );
}

function SoloCta({
  me, registered, paid, isWaitlist, registering, feeLabel, onRegister, guestDone, onGuest, onPay,
}: CtaCommon & { feeLabel: string; onRegister: () => void }) {
  if (me === "loading") return <button className="dc-ev-btn-dark" disabled>…</button>;
  // Anonym = Gast-Reservierung (ohne Zahlung)
  if (me === null) {
    if (paid) return (
      <span className="dc-ev-btn-dark is-registered"><Check /> Bezahlt — wir sehen uns</span>
    );
    if (guestDone) return (
      <span className="dc-ev-btn-dark is-registered"><Check /> Reserviert</span>
    );
    return (
      <button type="button" className="dc-ev-btn-dark" onClick={onGuest}>
        Ticket für {feeLabel} kaufen <Arrow />
      </button>
    );
  }
  if (paid) return (
    <span className="dc-ev-btn-dark is-registered">
      <Check /> Bezahlt — wir sehen uns
    </span>
  );
  if (isWaitlist && registered) return (
    <span className="dc-ev-btn-dark is-registered">
      <Check /> Du bist auf der Warteliste
    </span>
  );
  if (isWaitlist) return (
    <button type="button" className="dc-ev-btn-dark" onClick={onRegister} disabled={registering}>
      {registering ? "Wird eingetragen …" : <>Auf Warteliste setzen <Arrow /></>}
    </button>
  );
  if (registered) return (
    <button type="button" className="dc-ev-btn-dark" onClick={onPay} disabled={registering}>
      Jetzt bezahlen ({feeLabel}) <Arrow />
    </button>
  );
  return (
    <button type="button" className="dc-ev-btn-dark" onClick={onRegister} disabled={registering}>
      {registering ? "Wird weitergeleitet …" : <>Ticket für {feeLabel} buchen <Arrow /></>}
    </button>
  );
}

// Gast-Reservierung ohne Login (öffentliche Events): Name + E-Mail.
function GuestForm({ eventId, ticketId, label, cents, onClose, onDone }: {
  eventId: number; ticketId: number | null; label: string; cents: number;
  onClose: () => void; onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!name.trim() || !email.trim()) { setErr("Bitte Name und E-Mail angeben."); return; }
    setBusy(true);
    try {
      const r = await startGuestCheckout(eventId, { name: name.trim(), email: email.trim(), ticket_id: ticketId });
      if (r.checkout_url) { window.location.href = r.checkout_url; return; }
      if (r.free && r.redirect) { window.location.href = r.redirect; return; }
      onDone();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Zahlung konnte nicht gestartet werden.");
      setBusy(false);
    }
  };

  return (
    <div className="dc-ev-guest-ov" onClick={onClose} role="dialog" aria-modal="true">
      <form className="dc-ev-guest" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <button type="button" className="dc-ev-guest-x" onClick={onClose} aria-label="Schließen">✕</button>
        <div className="dc-ev-guest-eyebrow">{label} · {euro(cents)}</div>
        <h3 className="dc-ev-guest-title">{cents > 0 ? "Ticket kaufen" : "Platz reservieren"}</h3>
        <p className="dc-ev-guest-sub">
          {cents > 0
            ? "Trag dich kurz ein — danach geht's direkt zur sicheren Zahlung."
            : "Trag dich kurz ein — du bekommst deine Bestätigung per E-Mail."}
        </p>
        <label className="dc-ev-guest-field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Max Mustermann" disabled={busy} required />
        </label>
        <label className="dc-ev-guest-field">
          <span>E-Mail</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="max@firma.at" disabled={busy} required />
        </label>
        {err && <p className="dc-ev-guest-err">{err}</p>}
        <button type="submit" className="dc-ev-btn-primary dc-ev-guest-submit" disabled={busy}>
          {busy ? "Wird vorbereitet …" : <>{cents > 0 ? "Weiter zur Zahlung" : "Platz reservieren"} <Arrow /></>}
        </button>
        <p className="dc-ev-guest-note">Mitglied im DealCircle? <a href="/mitglieder/login/">Einloggen</a> und günstiger sichern.</p>
      </form>
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
