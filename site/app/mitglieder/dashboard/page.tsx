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
import { getAuth, type AuthState } from "../../../components/member/auth";
import { buildDemoData } from "../../../components/member/demoData";
import type { TabKey, UpcomingEvent } from "../../../components/member/types";

const TITLES: Record<TabKey, string> = {
  uebersicht: "",
  events:     "Anstehende Treffen.",
  galerie:    "Bildergalerie.",
  mitglieder: "Mitglieder.",
  notizen:    "Aus dem Kreis.",
  profil:     "Ihr Profil.",
};

const SUBS: Record<TabKey, string> = {
  uebersicht: "Was als nächstes ansteht, was war, und was Sie nicht verpassen sollten.",
  events:     "Alle anstehenden Treffen und Anmeldungen auf einen Blick.",
  galerie:    "Bilder aus den vergangenen Treffen — geteilt nur unter Mitgliedern.",
  mitglieder: "Wer dabei ist. Profile sichtbar nur im Kreis.",
  notizen:    "Notizen, Decks und Materialien aus dem Kreis.",
  profil:     "Ihre Stammdaten, Rechnungen und Mitgliedschaft.",
};

export default function DashboardPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState | null | "loading">("loading");
  const [active, setActive] = useState<TabKey>("uebersicht");
  const [modalEvent, setModalEvent] = useState<UpcomingEvent | null>(null);

  useEffect(() => {
    const a = getAuth();
    if (!a) {
      router.replace("/mitglieder/login");
      return;
    }
    setAuth(a);
  }, [router]);

  const data = useMemo(() => buildDemoData(), []);

  if (auth === "loading" || auth === null) {
    return (
      <div className="mb-shell" style={{ gridTemplateColumns: "1fr", placeItems: "center" }}>
        <div style={{ color: "var(--color-ink-muted)", padding: 80 }}>Mitgliederbereich wird geladen …</div>
      </div>
    );
  }

  const firstName = (auth.email.split("@")[0] || "").split(/[.\-_]/)[0] || "Mitglied";
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  const headerTitle = active === "uebersicht" ? `Guten Abend, ${displayName}.` : TITLES[active];

  return (
    <div className="mb-shell">
      <Sidebar active={active} setActive={setActive} auth={auth} />
      <main className="mb-main">
        <header className="mb-main-header">
          <div className="mb-main-header-left">
            <h1 className="mb-main-header-title">{headerTitle}</h1>
            <p className="mb-main-header-sub">{SUBS[active]}</p>
          </div>
          <div className="mb-main-header-actions">
            <div className="mb-search">
              <svg
                className="mb-search-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input type="search" placeholder="Suchen — Mitglieder, Events, Notizen …" />
            </div>
          </div>
        </header>

        {active === "uebersicht" && (
          <>
            <NextEvent event={data.nextEvent} onSignup={() => setModalEvent(data.upcoming[0])} />
            <Stats items={data.stats} />

            <section className="mb-section">
              <div className="mb-section-head">
                <h2 className="mb-section-title">Bald auf Schloss Wiespach.</h2>
                <a
                  className="mb-section-link"
                  href="#events"
                  onClick={(e) => { e.preventDefault(); setActive("events"); }}
                >
                  Alle Events
                </a>
              </div>
              <UpcomingEvents events={data.upcoming.slice(0, 4)} onSignup={(e) => setModalEvent(e)} />
            </section>

            <section className="mb-section">
              <div className="mb-section-head">
                <h2 className="mb-section-title">Aus den letzten Abenden.</h2>
                <a
                  className="mb-section-link"
                  href="#galerie"
                  onClick={(e) => { e.preventDefault(); setActive("galerie"); }}
                >
                  Zur Galerie
                </a>
              </div>
              <Gallery albums={data.albums.slice(0, 5)} />
            </section>

            <section className="mb-section">
              <div className="mb-section-head">
                <h2 className="mb-section-title">Vergangene Treffen.</h2>
                <a
                  className="mb-section-link"
                  href="#notizen"
                  onClick={(e) => { e.preventDefault(); setActive("notizen"); }}
                >
                  Notizen & Materialien
                </a>
              </div>
              <PastEvents events={data.past.slice(0, 5)} />
            </section>
          </>
        )}

        {active === "events" && (
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

        {active === "galerie" && (
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

        {active === "mitglieder" && (
          <section className="mb-section">
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--color-ink-muted)" }}>
              <p className="dc-body-lg" style={{ maxWidth: 480, margin: "0 auto" }}>
                Das Mitgliederverzeichnis ist nur nach erstmaliger Anmeldung freigeschaltet
                — bitte aktualisieren Sie zuerst Ihr Profil.
              </p>
            </div>
          </section>
        )}

        {active === "notizen" && (
          <section className="mb-section">
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--color-ink-muted)" }}>
              <p className="dc-body-lg" style={{ maxWidth: 480, margin: "0 auto" }}>
                Notizen, Decks und Materialien aus den letzten Treffen werden hier
                innerhalb von 14 Tagen nach jedem Abend geteilt.
              </p>
            </div>
          </section>
        )}

        {active === "profil" && (
          <section className="mb-section">
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--color-ink-muted)" }}>
              <p className="dc-body-lg" style={{ maxWidth: 480, margin: "0 auto" }}>
                Profil-, Rechnungs- und Mitgliedschaftseinstellungen folgen.
              </p>
            </div>
          </section>
        )}
      </main>

      {modalEvent && <EventModal event={modalEvent} onClose={() => setModalEvent(null)} />}
    </div>
  );
}
