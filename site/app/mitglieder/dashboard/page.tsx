"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../../components/member/Sidebar";
import NextEvent from "../../../components/member/NextEvent";
import Stats from "../../../components/member/Stats";
import UpcomingEvents from "../../../components/member/UpcomingEvents";
import Gallery from "../../../components/member/Gallery";
import PastEvents from "../../../components/member/PastEvents";
import MembersAdmin from "../../../components/member/MembersAdmin";
import EventsAdmin from "../../../components/member/EventsAdmin";
import Applications from "../../../components/member/Applications";
import Profile from "../../../components/member/Profile";
import MyRegistrations from "../../../components/member/MyRegistrations";
import { fetchMe, type AuthUser } from "../../../components/member/auth";
import {
  isPast, listEvents, registerForEvent, startCheckout,
  toNextEventShape, toPastShape, toUpcomingShape,
} from "../../../components/member/events";
import type { Album, EventDto, StatItem, TabKey, Ticket, UpcomingEvent } from "../../../components/member/types";

const TITLES: Record<TabKey, string> = {
  uebersicht:    "",
  events:        "Anstehende Treffen.",
  galerie:       "Bildergalerie.",
  mitglieder:    "Mitglieder.",
  notizen:       "Aus dem Kreis.",
  profil:        "Dein Profil.",
  verwaltung:    "Mitglieder verwalten.",
  antraege:      "Offene Anträge.",
  "events-admin": "Events verwalten.",
};

const SUBS: Record<TabKey, string> = {
  uebersicht:    "Was als nächstes ansteht, was war, und was du nicht verpassen solltest.",
  events:        "Alle anstehenden Treffen und Anmeldungen auf einen Blick.",
  galerie:       "Bilder aus den vergangenen Treffen — geteilt nur unter Mitgliedern.",
  mitglieder:    "Wer dabei ist. Profile sichtbar nur im Kreis.",
  notizen:       "Notizen, Decks und Materialien aus dem Kreis.",
  profil:        "Deine Stammdaten, Rechnungen und Mitgliedschaft.",
  verwaltung:    "Mitglieder-Accounts anlegen, Rollen ändern, Zugänge zurücksetzen.",
  antraege:      "Aufnahme-Anträge prüfen, annehmen oder ablehnen.",
  "events-admin": "Events anlegen, bearbeiten und löschen.",
};

const ALBUM_TONES = ["violet", "magenta", "orange", "coral", "dusk"] as const;

const euroFromCents = (cents: number) => `${Math.round(cents / 100).toLocaleString("de-AT")} €`;
// Mitglieder-Preis: Rabatt vom Listenpreis abziehen (wie auf der Event-Seite).
const memberCents = (cents: number, pct: number) => Math.round((cents * (100 - (pct || 0))) / 100);

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null | "loading">("loading");
  const [active, setActive] = useState<TabKey>("uebersicht");
  const [events, setEvents] = useState<EventDto[] | null>(null);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [notice, setNotice] = useState<"paid" | "waitlist" | "already" | null>(null);
  const [ticketPick, setTicketPick] = useState<{ eventId: number; title: string; pct: number; tickets: Ticket[] } | null>(null);

  // Rueckkehr von Stripe: success_url setzt ?paid=1 → Danke-Pop-up zeigen,
  // dann die Query-Parameter wieder aus der URL entfernen.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paid = params.get("paid") === "1";
    if (paid) setNotice("paid");
    if (paid || params.get("cancelled") === "1") {
      const url = new URL(window.location.href);
      url.searchParams.delete("paid");
      url.searchParams.delete("cancelled");
      url.searchParams.delete("event");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    }
  }, []);

  // Event kaufen: bei mehreren Ticket-Kategorien zuerst die Auswahl zeigen
  // (mit rabattiertem Mitglieder-Preis), sonst direkt zu Stripe. Mitglieder
  // bekommen den Rabatt automatisch — das Backend wendet member_discount_pct
  // an. Warteliste-Events werden nur eingetragen (keine Zahlung).
  const payEvent = async (ev: UpcomingEvent) => {
    setPayError(null);
    if (ev.status === "waitlist") {
      try {
        await registerForEvent(ev.eventId);
        setNotice("waitlist");
      } catch (err) {
        setPayError(err instanceof Error ? err.message : "Eintragen fehlgeschlagen.");
      }
      return;
    }
    const raw = (events || []).find((e) => e.id === ev.eventId);
    const tickets = raw?.tickets ?? [];
    if (tickets.length >= 2) {
      // Mehrere Preiskategorien → Auswahl zeigen (Preise inkl. Mitglieder-Rabatt).
      setTicketPick({ eventId: ev.eventId, title: ev.title, pct: raw?.member_discount_pct ?? 0, tickets });
      return;
    }
    // Genau 1 Kategorie → diese nehmen; keine → Basis-Beitrag (null).
    await buyTicket(ev.eventId, tickets.length === 1 ? (tickets[0].id ?? null) : null);
  };

  // Mit gewählter Ticket-Kategorie anmelden und direkt zu Stripe.
  const buyTicket = async (eventId: number, ticketId: number | null) => {
    setTicketPick(null);
    setPayError(null);
    setPaying(true);
    try {
      try {
        await registerForEvent(eventId, ticketId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (/bereits bezahlt|already_paid/i.test(msg)) {
          setPaying(false);
          setNotice("already");
          return;
        }
        // andere Hinweise (z. B. schon reserviert) ignorieren — Checkout startet trotzdem
      }
      const r = await startCheckout(eventId, "dashboard");
      if (r.free && r.redirect) { window.location.href = r.redirect; return; }
      if (r.checkout_url) { window.location.href = r.checkout_url; return; }
      setPaying(false);
      setPayError("Zahlung konnte nicht gestartet werden.");
    } catch (err) {
      setPaying(false);
      setPayError(err instanceof Error ? err.message : "Zahlung fehlgeschlagen.");
    }
  };

  // Auth check
  useEffect(() => {
    let cancelled = false;
    fetchMe().then((u) => {
      if (cancelled) return;
      if (!u) {
        router.replace("/mitglieder/login/");
        return;
      }
      setUser(u);
    });
    return () => { cancelled = true; };
  }, [router]);

  // Events laden, sobald authed
  useEffect(() => {
    if (user === "loading" || user === null) return;
    let cancelled = false;
    listEvents()
      .then((list) => { if (!cancelled) setEvents(list); })
      .catch((err) => { if (!cancelled) setEventsError(err instanceof Error ? err.message : "Events nicht ladbar."); });
    return () => { cancelled = true; };
  }, [user]);

  // Wenn ein Event neu angelegt wurde (per EventsAdmin), aktualisieren wir die Liste,
  // sobald der User zurueck auf einen Anzeige-Tab wechselt.
  useEffect(() => {
    if (active === "events-admin") return;
    if (user === "loading" || user === null) return;
    listEvents().then(setEvents).catch(() => {});
  }, [active, user]);

  const derived = useMemo(() => {
    if (!events) return null;
    const now = Date.now();
    const upcoming = events.filter((e) => !isPast(e, now)).map(toUpcomingShape);
    const past = events.filter((e) => isPast(e, now))
      .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
      .map(toPastShape);

    const firstUpcoming = events
      .filter((e) => !isPast(e, now))
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0];

    const nextEvent = firstUpcoming ? toNextEventShape(firstUpcoming) : null;

    // Main-Event (gross oben im Events-Tab): das naechste als is_main markierte Event.
    const mainEventRaw = events
      .filter((e) => !isPast(e, now) && e.is_main)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0];
    const mainEvent = mainEventRaw ? toNextEventShape(mainEventRaw) : null;
    const mainEventId = mainEventRaw ? mainEventRaw.id : null;

    const visited = events.filter((e) => isPast(e, now)).length;
    const stats: StatItem[] = [
      { label: "Treffen besucht",   value: String(visited),                    note: visited > 0 ? "Stand heute" : "noch keines" },
      { label: "Nächste Anmeldung", value: nextEvent ? "offen" : "—",          note: firstUpcoming?.title ?? "Kein Treffen geplant" },
      { label: "Offene Beiträge",   value: "€ 0",                              note: "alle Zahlungen aktuell" },
    ];

    // Album-Platzhalter aus den letzten 5 vergangenen Events ableiten
    const albums: Album[] = events
      .filter((e) => isPast(e, now))
      .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
      .slice(0, 5)
      .map((e, i) => ({
        title: e.title,
        meta: new Date(e.starts_at).toLocaleDateString("de-AT", { day: "numeric", month: "long", year: "numeric" }),
        count: 0,
        tone: ALBUM_TONES[i % ALBUM_TONES.length],
      }));

    return { upcoming, past, nextEvent, mainEvent, mainEventId, stats, albums };
  }, [events]);

  if (user === "loading" || user === null) {
    return (
      <div className="mb-shell" style={{ gridTemplateColumns: "1fr", placeItems: "center" }}>
        <div style={{ color: "var(--color-ink-muted)", padding: 80 }}>
          Mitgliederbereich wird geladen …
        </div>
      </div>
    );
  }

  // Defense-in-depth: wenn ein Mitglied (Nicht-Admin) auf einem Admin-only-Tab
  // landet (via URL, Bookmarks, alter State), redirect auf Uebersicht.
  // "mitglieder" wurde entfernt — Admin nutzt "verwaltung". Wenn ein
  // alter Bookmark/URL-Hash trotzdem darauf zeigt, rerouten wir.
  const ADMIN_ONLY_TABS: TabKey[] = ["mitglieder", "verwaltung", "antraege", "events-admin"];
  const REROUTE_TO_ADMIN: TabKey[] = ["mitglieder"];
  const safeActive: TabKey =
    REROUTE_TO_ADMIN.includes(active) && user.role === "admin"
      ? "verwaltung"
      : ADMIN_ONLY_TABS.includes(active) && user.role !== "admin"
        ? "uebersicht"
        : active;

  const firstName = (user.name || "").split(/\s+/)[0] || "Mitglied";
  const headerTitle = safeActive === "uebersicht" ? `Guten Abend, ${firstName}.` : TITLES[safeActive];

  return (
    <div className="mb-shell">
      <Sidebar active={safeActive} setActive={setActive} user={user} />
      <main className={`mb-main${safeActive === "events-admin" ? " mb-main--bleed" : ""}`}>
        {safeActive !== "events-admin" && (
        <header className="mb-main-header">
          <div className="mb-main-header-left">
            <h1 className="mb-main-header-title">{headerTitle}</h1>
            <p className="mb-main-header-sub">{SUBS[safeActive]}</p>
          </div>
          <div className="mb-main-header-actions">
            <div className="mb-search">
              <svg
                className="mb-search-icon"
                width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input type="search" placeholder="Suchen — Mitglieder, Events, Notizen …" />
            </div>
          </div>
        </header>
        )}

        {eventsError && (
          <div className="mb-admin-alert mb-admin-alert--error" style={{ margin: 0 }}>
            {eventsError}
          </div>
        )}

        {safeActive === "uebersicht" && (
          <>
            {derived?.nextEvent ? (
              <NextEvent
                event={derived.nextEvent}
                onSignup={() => { if (derived.upcoming[0]) payEvent(derived.upcoming[0]); }}
              />
            ) : (
              <section className="mb-section" style={{ background: "var(--color-surface-1)", padding: "40px", borderRadius: "var(--r-xxl)", textAlign: "center" }}>
                <p className="dc-body-lg" style={{ color: "var(--color-ink-muted)", margin: 0 }}>
                  Kein anstehendes Treffen geplant. Das nächste Datum wird hier sichtbar, sobald es feststeht.
                </p>
              </section>
            )}

            {derived?.stats && <Stats items={derived.stats} />}

            <MyRegistrations />

            {derived?.upcoming && derived.upcoming.length > 0 && (
              <section className="mb-section">
                <div className="mb-section-head">
                  <h2 className="mb-section-title">Deine nächsten Treffen.</h2>
                  <a className="mb-section-link" href="#events"
                     onClick={(e) => { e.preventDefault(); setActive("events"); }}>
                    Alle Events
                  </a>
                </div>
                <UpcomingEvents events={derived.upcoming.slice(0, 4)} onSignup={(e) => payEvent(e)} />
              </section>
            )}

            {derived?.albums && derived.albums.length > 0 && (
              <section className="mb-section">
                <div className="mb-section-head">
                  <h2 className="mb-section-title">Aus den letzten Abenden.</h2>
                  <a className="mb-section-link" href="#galerie"
                     onClick={(e) => { e.preventDefault(); setActive("galerie"); }}>
                    Zur Galerie
                  </a>
                </div>
                <Gallery albums={derived.albums} />
              </section>
            )}

            {derived?.past && derived.past.length > 0 && (
              <section className="mb-section">
                <div className="mb-section-head">
                  <h2 className="mb-section-title">Vergangene Treffen.</h2>
                  <a className="mb-section-link" href="#notizen"
                     onClick={(e) => { e.preventDefault(); setActive("notizen"); }}>
                    Notizen & Materialien
                  </a>
                </div>
                <PastEvents events={derived.past.slice(0, 5)} />
              </section>
            )}
          </>
        )}

        {safeActive === "events" && derived && (() => {
          // Oben gross: das anstehende Main-Event (Fallback: naechstes Treffen).
          const big = derived.mainEvent ?? derived.nextEvent;
          const bigId = derived.mainEventId ?? derived.nextEvent?.id ?? null;
          const others = derived.upcoming.filter((u) => u.eventId !== bigId);
          const bigUpcoming = derived.upcoming.find((u) => u.eventId === bigId);
          return (
            <>
              {big && (
                <NextEvent
                  event={big}
                  onSignup={() => { if (bigUpcoming) payEvent(bigUpcoming); }}
                />
              )}
              <section className="mb-section">
                <div className="mb-section-head">
                  <h2 className="mb-section-title">{big ? "Weitere Treffen." : "Alle anstehenden Treffen."}</h2>
                </div>
                {others.length > 0 ? (
                  <UpcomingEvents events={others} onSignup={(e) => payEvent(e)} />
                ) : (
                  <div className="mb-admin-empty">{big ? "Keine weiteren Treffen geplant." : "Aktuell sind keine Treffen geplant."}</div>
                )}
              </section>
            </>
          );
        })()}

        {safeActive === "galerie" && (
          <>
            {derived?.albums && derived.albums.length > 0 ? (
              <section className="mb-section">
                <Gallery albums={derived.albums} />
              </section>
            ) : (
              <section className="mb-section">
                <div className="mb-admin-empty">Noch keine Galerie verfügbar.</div>
              </section>
            )}
            {derived?.past && derived.past.length > 0 && (
              <section className="mb-section">
                <div className="mb-section-head">
                  <h2 className="mb-section-title">Alle Alben.</h2>
                </div>
                <PastEvents events={derived.past} />
              </section>
            )}
          </>
        )}


        {safeActive === "notizen" && (
          <section className="mb-section">
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--color-ink-muted)" }}>
              <p className="dc-body-lg" style={{ maxWidth: 480, margin: "0 auto" }}>
                Notizen, Decks und Materialien aus den letzten Treffen werden hier
                innerhalb von 14 Tagen nach jedem Abend geteilt.
              </p>
            </div>
          </section>
        )}

        {safeActive === "profil" && <Profile />}

        {safeActive === "verwaltung" && user.role === "admin" && (
          <MembersAdmin currentUserEmail={user.email} />
        )}

        {safeActive === "antraege" && user.role === "admin" && (
          <Applications />
        )}

        {safeActive === "events-admin" && user.role === "admin" && (
          <EventsAdmin />
        )}
      </main>

      {ticketPick && (
        <div className="mb-modal-backdrop" onClick={() => setTicketPick(null)}>
          <div className="mb-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="mb-modal-header">
              <div>
                <span className="mb-modal-eyebrow">Ticket wählen</span>
                <h3 className="mb-modal-title">{ticketPick.title}</h3>
                <p className="mb-modal-sub" style={{ marginTop: 6 }}>
                  {ticketPick.pct > 0
                    ? `Mitglieder-Preise — −${ticketPick.pct}% sind bereits abgezogen.`
                    : "Wähle deine Kategorie."}
                </p>
              </div>
              <button type="button" className="mb-modal-close" onClick={() => setTicketPick(null)} aria-label="Schließen">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="mb-modal-body">
              <div className="mb-ticketpick">
                {ticketPick.tickets.map((t, i) => {
                  const net = memberCents(t.price_cents, ticketPick.pct);
                  const discounted = ticketPick.pct > 0 && net !== t.price_cents;
                  return (
                    <button
                      key={t.id ?? i}
                      type="button"
                      className="mb-ticketpick-opt"
                      data-featured={t.featured ? "true" : "false"}
                      onClick={() => buyTicket(ticketPick.eventId, t.id ?? null)}
                    >
                      <span className="mb-ticketpick-main">
                        {t.badge && <span className="mb-ticketpick-badge">{t.badge}</span>}
                        <span className="mb-ticketpick-name">{t.name}</span>
                        <span className="mb-ticketpick-note">exkl. MwSt. · exkl. Getränke · inkl. Dinner &amp; Aperitif</span>
                      </span>
                      <span className="mb-ticketpick-price">
                        <span className="mb-ticketpick-eur">{euroFromCents(net)}</span>
                        {discounted && <span className="mb-ticketpick-was">{euroFromCents(t.price_cents)}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {paying && (
        <div className="mb-modal-backdrop">
          <div className="mb-modal" role="dialog" aria-modal="true">
            <div className="mb-modal-success">
              <h3 className="mb-modal-title" style={{ margin: 0 }}>Weiterleitung zu Stripe …</h3>
              <p className="mb-modal-sub" style={{ maxWidth: 360 }}>
                Du wirst sicher zur Zahlung weitergeleitet. Einen Moment bitte.
              </p>
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div className="mb-modal-backdrop" onClick={() => setNotice(null)}>
          <div className="mb-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="mb-modal-header" style={{ paddingTop: 0 }}>
              <span />
              <button type="button" className="mb-modal-close" onClick={() => setNotice(null)} aria-label="Schließen">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="mb-modal-success">
              <div className="mb-modal-success-check">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="mb-modal-title" style={{ margin: 0 }}>
                {notice === "paid" ? "Danke für deine Zahlung." : notice === "already" ? "Du bist bereits angemeldet." : "Du stehst auf der Warteliste."}
              </h3>
              <p className="mb-modal-sub" style={{ maxWidth: 380 }}>
                {notice === "paid"
                  ? "Deine Zahlung ist eingegangen — du bist für das Event angemeldet. Bestätigung und Rechnung kommen per E-Mail."
                  : notice === "already"
                  ? "Für dieses Event liegt bereits eine bezahlte Anmeldung von dir vor."
                  : "Wir haben dich auf die Warteliste gesetzt und melden uns, sobald ein Platz frei wird."}
              </p>
              <button type="button" className="dc-btn dc-btn-primary" onClick={() => setNotice(null)}>Schließen</button>
            </div>
          </div>
        </div>
      )}

      {payError && (
        <div className="mb-modal-backdrop" onClick={() => setPayError(null)}>
          <div className="mb-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="mb-modal-header">
              <div>
                <span className="mb-modal-eyebrow">Zahlung</span>
                <h3 className="mb-modal-title">Das hat nicht geklappt.</h3>
              </div>
              <button type="button" className="mb-modal-close" onClick={() => setPayError(null)} aria-label="Schließen">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="mb-modal-body">
              <p className="mb-modal-sub" style={{ margin: 0 }}>{payError}</p>
            </div>
            <div className="mb-modal-foot" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="dc-btn dc-btn-primary" onClick={() => setPayError(null)}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
