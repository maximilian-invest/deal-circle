"use client";
import { useEffect, useState } from "react";
import Footer from "../../components/Footer";

export default function DankePage() {
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id && /^\d+$/.test(id)) setEventId(id);
  }, []);

  return (
    <div className="dc-thanks">
      <header className="dc-thanks-nav">
        <a href="/" className="dc-thanks-brand" aria-label="DealCircle">
          <img src="/assets/logo-dc-white.svg" alt="" width={30} height={24} aria-hidden="true" />
          <span>DealCircle</span>
        </a>
      </header>

      <main className="dc-thanks-main">
        <div className="dc-thanks-aura" aria-hidden="true" />
        <div className="dc-thanks-card">
          <div className="dc-thanks-check" aria-hidden="true">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <span className="dc-thanks-eyebrow">Zahlung bestätigt</span>
          <h1 className="dc-thanks-title">Danke — dein Platz ist fix.</h1>
          <p className="dc-thanks-text">
            Deine Zahlung ist bei uns eingegangen. Die Bestätigung und deine
            Rechnung sind in den nächsten Minuten in deinem Postfach. Wir freuen
            uns auf dich.
          </p>
          <div className="dc-thanks-actions">
            {eventId && (
              <a className="dc-thanks-btn dc-thanks-btn--primary" href={`/event/?id=${eventId}&paid=1`}>
                Zur Event-Seite
              </a>
            )}
            <a className="dc-thanks-btn dc-thanks-btn--ghost" href="/">Zur Startseite</a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
