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
import { fetchMe, type AuthUser } from "../../../components/member/auth";
import { buildDemoData } from "../../../components/member/demoData";
import type { TabKey, UpcomingEvent } from "../../../components/member/types";

const TITLES: Record<TabKey, string> = {
  uebersicht: "",
  events:     "Anstehende Treffen.",
  galerie:    "Bildergalerie.",
  mitglieder: "Mitglieder.",
  notizen:    "Aus dem Kreis.",
  profil:     "Ihr Profil.",
  verwaltung: "Mitglieder verwalten.",
};

const SUBS: Record<TabKey, string> = {
  uebersicht: "Was als nächstes ansteht, was war, und was Sie nicht verpassen sollten.",
  events:     "Alle anstehenden Treffen und Anmeldungen auf einen Blick.",
  galerie:    "Bilder aus den vergangenen Treffen — geteilt nur unter Mitgliedern.",
  mitglieder: "Wer dabei ist. Profile sichtbar nur im Kreis.",
  notizen:    "Notizen, Decks und Materialien aus dem Kreis.",
  profil:     "Ihre Stammdaten, Rechnungen und Mitgliedschaft.",
  verwaltung: "Mitglieder-Accounts anlegen, Rollen ändern, Zugänge zurücksetzen.",
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null | "loading">("loading");
  const [active, setActive] = useState<TabKey>("uebersicht");
  const [modalEvent, setModalEvent] = useState<UpcomingEvent | null>(null);

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

  const data = useMemo(() => buildDemoData(), []);

  if (user === "loading" || user === null) {
    return (
      <div className="mb-shell" style={{ gridTemplateColumns: "1fr", placeItems: "center" }}>
        <div style={{ color: "var(--color-ink-muted)", padding: 80 }}>
          Mitgliederbereich wird geladen …
        </div>
      </div>
    );
  }

  // If non-admin user lands on verwaltung (shouldn't happen via UI, but defensive)
  const safeActive: TabKey =
    active === "verwaltung" && user.role !== "admin" ? "uebersicht" : active;

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

        {safeActive === "uebersicht" && (
          <>
            <NextEvent event={data.nextEvent} onSignup={() => setModalEvent(data.upcoming[0])} />
            <Stats items={data.stats} />

            <section className="mb-section">
              <div className="mb-section-head">
                <h2 className="mb-section-title">Bald auf Schloss Wiespach.</h2>
                <a className="mb-section-link" href="#events"
                   onClick={(e) => { e.preventDefault(); setActive("events"); }}>
                  Alle Events
                </a>
              </div>
              <UpcomingEvents events={data.upcoming.slice(0, 4)} onSignup={(e) => setModalEvent(e)} />
            </section>

            <section className="mb-section">
              <div className="mb-section-head">
                <h2 className="mb-section-title">Aus den letzten Abenden.</h2>
                <a className="mb-section-link" href="#galerie"
                   onClick={(e) => { e.preventDefault(); setActive("galerie"); }}>
                  Zur Galerie
                </a>
              </div>
              <Gallery albums={data.albums.slice(0, 5)} />
            </section>

            <section className="mb-section">
              <div className="mb-section-head">
                <h2 className="mb-section-title">Vergangene Treffen.</h2>
                <a className="mb-section-link" href="#notizen"
                   onClick={(e) => { e.preventDefault(); setActive("notizen"); }}>
                  Notizen & Materialien
                </a>
              </div>
              <PastEvents events={data.past.slice(0, 5)} />
            </section>
          </>
        )}

        {safeActive === "events" && (
          <>
            <NextEvent event={data.nextEvent} onSignup={() => setModalEvent(data.upcoming[0])} />
            <section className="mb-section">
              <div className="mb-section-head">
                <h2 className="mb-section-title">Alle anstehenden Treffen.</h2>
              </div>
              <UpcomingEvents events={data.upcoming} onSignup={(e) => setModalEvent(e)} />
            </section>
          </>
        )}

        {safeActive === "galerie" && (
          <>
            <section className="mb-section">
              <Gallery albums={data.albums} />
            </section>
            <section className="mb-section">
              <div className="mb-section-head">
                <h2 className="mb-section-title">Alle Alben.</h2>
              </div>
              <PastEvents events={data.past} />
            </section>
          </>
        )}

        {safeActive === "mitglieder" && (
          <section className="mb-section">
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--color-ink-muted)" }}>
              <p className="dc-body-lg" style={{ maxWidth: 480, margin: "0 auto" }}>
                Das Mitgliederverzeichnis ist nur nach erstmaliger Anmeldung freigeschaltet
                — bitte aktualisieren Sie zuerst Ihr Profil.
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

        {safeActive === "profil" && (
          <section className="mb-section">
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--color-ink-muted)" }}>
              <p className="dc-body-lg" style={{ maxWidth: 480, margin: "0 auto" }}>
                Profil-, Rechnungs- und Mitgliedschaftseinstellungen folgen.
              </p>
            </div>
          </section>
        )}

        {safeActive === "verwaltung" && user.role === "admin" && (
          <MembersAdmin currentUserEmail={user.email} />
        )}
      </main>

      {modalEvent && <EventModal event={modalEvent} onClose={() => setModalEvent(null)} />}
    </div>
  );
}
