"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../../components/member/Sidebar";
import NextEvent from "../../../components/member/NextEvent";
import Stats from "../../../components/member/Stats";
import UpcomingEvents from "../../../components/member/UpcomingEvents";
import Gallery from "../../../components/member/Gallery";
import PastEvents from "../../../components/member/PastEvents";
import EventModal from "../../../components/member/EventModal";
import MembersAdmin from "../../../components/member/MembersAdmin";
import EventsAdmin from "../../../components/member/EventsAdmin";
import Profile from "../../../components/member/Profile";
import { fetchMe, type AuthUser } from "../../../components/member/auth";
import {
  isPast, listEvents, toNextEventShape, toPastShape, toUpcomingShape,
} from "../../../components/member/events";
import type { Album, EventDto, StatItem, TabKey, UpcomingEvent } from "../../../components/member/types";

const TITLES: Record<TabKey, string> = {
  uebersicht:    "",
  events:        "Anstehende Treffen.",
  galerie:       "Bildergalerie.",
  mitglieder:    "Mitglieder.",
  notizen:       "Aus dem Kreis.",
  profil:        "Ihr Profil.",
  verwaltung:    "Mitglieder verwalten.",
  "events-admin": "Events verwalten.",
};

const SUBS: Record<TabKey, string> = {
  uebersicht:    "Was als nächstes ansteht, was war, und was Sie nicht verpassen sollten.",
  events:        "Alle anstehenden Treffen und Anmeldungen auf einen Blick.",
  galerie:       "Bilder aus den vergangenen Treffen — geteilt nur unter Mitgliedern.",
  mitglieder:    "Wer dabei ist. Profile sichtbar nur im Kreis.",
  notizen:       "Notizen, Decks und Materialien aus dem Kreis.",
  profil:        "Ihre Stammdaten, Rechnungen und Mitgliedschaft.",
  verwaltung:    "Mitglieder-Accounts anlegen, Rollen ändern, Zugänge zurücksetzen.",
  "events-admin": "Events anlegen, bearbeiten und löschen.",
};

const ALBUM_TONES = ["violet", "magenta", "orange", "coral", "dusk"] as const;

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null | "loading">("loading");
  const [active, setActive] = useState<TabKey>("uebersicht");
  const [modalEvent, setModalEvent] = useState<UpcomingEvent | null>(null);
  const [events, setEvents] = useState<EventDto[] | null>(null);
  const [eventsError, setEventsError] = useState<string | null>(null);

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

    return { upcoming, past, nextEvent, stats, albums };
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
  const ADMIN_ONLY_TABS: TabKey[] = ["mitglieder", "verwaltung", "events-admin"];
  const safeActive: TabKey =
    ADMIN_ONLY_TABS.includes(active) && user.role !== "admin" ? "uebersicht" : active;

  const firstName = (user.name || "").split(/\s+/)[0] || "Mitglied";
  const headerTitle = safeActive === "uebersicht" ? `Guten Abend, ${firstName}.` : TITLES[safeActive];

  return (
    <div className="mb-shell">
      <Sidebar active={safeActive} setActive={setActive} user={user} />
      <main className="mb-main">
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
                onSignup={() => derived.upcoming[0] && setModalEvent(derived.upcoming[0])}
              />
            ) : (
              <section className="mb-section" style={{ background: "var(--color-surface-1)", padding: "40px", borderRadius: "var(--r-xxl)", textAlign: "center" }}>
                <p className="dc-body-lg" style={{ color: "var(--color-ink-muted)", margin: 0 }}>
                  Kein anstehendes Treffen geplant. Das nächste Datum wird hier sichtbar, sobald es feststeht.
                </p>
              </section>
            )}

            {derived?.stats && <Stats items={derived.stats} />}

            {derived?.upcoming && derived.upcoming.length > 0 && (
              <section className="mb-section">
                <div className="mb-section-head">
                  <h2 className="mb-section-title">Bald auf Schloss Wiespach.</h2>
                  <a className="mb-section-link" href="#events"
                     onClick={(e) => { e.preventDefault(); setActive("events"); }}>
                    Alle Events
                  </a>
                </div>
                <UpcomingEvents events={derived.upcoming.slice(0, 4)} onSignup={(e) => setModalEvent(e)} />
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

        {safeActive === "events" && (
          <>
            {derived?.nextEvent && (
              <NextEvent
                event={derived.nextEvent}
                onSignup={() => derived.upcoming[0] && setModalEvent(derived.upcoming[0])}
              />
            )}
            <section className="mb-section">
              <div className="mb-section-head">
                <h2 className="mb-section-title">Alle anstehenden Treffen.</h2>
              </div>
              {derived?.upcoming && derived.upcoming.length > 0 ? (
                <UpcomingEvents events={derived.upcoming} onSignup={(e) => setModalEvent(e)} />
              ) : (
                <div className="mb-admin-empty">Aktuell sind keine Treffen geplant.</div>
              )}
            </section>
          </>
        )}

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

        {safeActive === "mitglieder" && user.role === "admin" && (
          <section className="mb-section">
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--color-ink-muted)" }}>
              <p className="dc-body-lg" style={{ maxWidth: 480, margin: "0 auto" }}>
                Das Mitgliederverzeichnis (Admin-Ansicht) wird im naechsten Sprint
                gebaut — Mitglieder-Profile mit Foto, Branche, Kontakt-Wunsch.
              </p>
            </div>
          </section>
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

        {safeActive === "events-admin" && user.role === "admin" && (
          <EventsAdmin />
        )}
      </main>

      {modalEvent && <EventModal event={modalEvent} onClose={() => setModalEvent(null)} />}
    </div>
  );
}
