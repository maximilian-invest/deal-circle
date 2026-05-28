"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { NextEventData } from "./types";

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

type Props = {
  event: NextEventData;
  onSignup: () => void;
};

export default function NextEvent({ event, onSignup }: Props) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const target = new Date(event.iso).getTime();
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hrs  = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  return (
    <motion.section
      className="mb-next"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
    >
      <div className="mb-next-bg" aria-hidden="true"></div>
      <div className="mb-next-left">
        <div>
          <span className="mb-next-eyebrow">
            <span className="mb-next-eyebrow-dot" aria-hidden="true"></span>
            Nächstes Treffen
          </span>
          <h2 className="mb-next-title">{event.title}</h2>
          <div className="mb-next-meta">
            <span><Icon d="M3 7h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM8 3v4M16 3v4" />{event.dateLabel}</span>
            <span><Icon d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />{event.location}</span>
            <span><Icon d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />{event.attendees} Plätze</span>
          </div>
        </div>
        <div className="mb-next-cta">
          {event.userStatus === "paid" ? (
            <>
              <span className="dc-btn dc-btn-primary dc-btn--lg" style={{ cursor: "default" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Angemeldet & bezahlt
                </span>
              </span>
              <a href="#" className="dc-btn dc-btn-secondary dc-btn--lg" onClick={(e) => e.preventDefault()}>Kalendereintrag</a>
            </>
          ) : (
            <>
              <button className="dc-btn dc-btn-primary dc-btn--lg" onClick={onSignup}>Jetzt anmelden</button>
              <a href="#" className="dc-btn dc-btn-secondary dc-btn--lg" onClick={(e) => e.preventDefault()}>Programm ansehen</a>
            </>
          )}
        </div>
      </div>

      <aside className="mb-next-right">
        <span className="mb-next-right-label">Countdown</span>
        <div className="mb-countdown">
          {[
            { v: days, l: "Tage" },
            { v: hrs,  l: "Std" },
            { v: mins, l: "Min" },
            { v: secs, l: "Sek" },
          ].map((c) => (
            <div key={c.l} className="mb-countdown-cell">
              <span className="mb-countdown-num">{String(c.v).padStart(2, "0")}</span>
              <span className="mb-countdown-label">{c.l}</span>
            </div>
          ))}
        </div>
        <div className="mb-next-status">
          <span>{event.confirmed} / {event.attendees} bestätigt</span>
          {event.userStatus === "paid" ? (
            <span className="mb-next-status-chip">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Sie nehmen teil
            </span>
          ) : (
            <span className="mb-next-status-chip" style={{ background: "rgba(255,154,168,0.16)", color: "#FFB1BD", borderColor: "rgba(255,154,168,0.32)" }}>
              Anmeldung offen
            </span>
          )}
        </div>
      </aside>
    </motion.section>
  );
}
