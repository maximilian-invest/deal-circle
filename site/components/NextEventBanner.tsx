"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type PublicEvent = {
  id: number;
  title: string;
  starts_at: string;
  time_label: string;
  location: string;
  status: string;
};

type State = "loading" | { event: PublicEvent } | "empty";

export default function NextEventBanner() {
  const [state, setState] = useState<State>("loading");
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    fetch("/api/events/public/next")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad_status"))))
      .then((data: { event: PublicEvent | null }) => {
        if (cancelled) return;
        if (data.event) setState({ event: data.event });
        else setState("empty");
      })
      .catch(() => { if (!cancelled) setState("empty"); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (typeof state !== "object") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state]);

  if (state === "loading" || state === "empty") return null;

  const event = state.event;
  const target = new Date(event.starts_at).getTime();
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hrs  = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);

  const d = new Date(event.starts_at);
  const dateLabel = d.toLocaleDateString("de-AT", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <motion.section
      className="dc-next-banner"
      aria-label="Nächstes Treffen"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
    >
      <div className="dc-next-banner-bg" aria-hidden="true" />

      <div className="dc-next-banner-inner">
        <div className="dc-next-banner-text">
          <span className="dc-next-banner-eyebrow">
            <span className="dc-next-banner-eyebrow-dot" aria-hidden="true" />
            Nächstes Treffen
          </span>
          <h2 className="dc-next-banner-title">{event.title}</h2>
          <div className="dc-next-banner-meta">
            <span className="dc-next-banner-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="16" y1="3" x2="16" y2="7" />
              </svg>
              {dateLabel} · {event.time_label}
            </span>
            <span className="dc-next-banner-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
              </svg>
              {event.location}
            </span>
          </div>
        </div>

        <div className="dc-next-banner-side">
          <div className="dc-next-banner-countdown">
            <div className="dc-next-banner-countdown-cell">
              <span className="dc-next-banner-countdown-num">{String(days).padStart(2, "0")}</span>
              <span className="dc-next-banner-countdown-label">Tage</span>
            </div>
            <div className="dc-next-banner-countdown-cell">
              <span className="dc-next-banner-countdown-num">{String(hrs).padStart(2, "0")}</span>
              <span className="dc-next-banner-countdown-label">Std</span>
            </div>
            <div className="dc-next-banner-countdown-cell">
              <span className="dc-next-banner-countdown-num">{String(mins).padStart(2, "0")}</span>
              <span className="dc-next-banner-countdown-label">Min</span>
            </div>
          </div>
          <a href="/mitglieder/login/" className="dc-btn dc-btn-primary dc-btn--lg dc-next-banner-cta">
            Zur Anmeldung
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginLeft: 6 }}>
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>
      </div>
    </motion.section>
  );
}
