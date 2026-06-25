"use client";
import { useEffect, useState } from "react";
import { fetchMe, logout } from "./member/auth";
import { getToken } from "./member/api";

type Props = {
  /** Ziel der Join-CTA, wenn niemand eingeloggt ist (z. B. "#kontakt"). */
  joinHref: string;
  /** Beschriftung der Join-CTA (z. B. "Mitglied werden"). */
  joinLabel: string;
  /** CSS-Klasse, identisch zur bisherigen CTA, damit das Styling passt. */
  className: string;
};

/**
 * Sekundäre Nav-CTA, abhängig vom Login-Status:
 *  - eingeloggt → "Logout" (Token löschen + zurück zur Startseite)
 *  - anonym     → Join-CTA (z. B. "Mitglied werden" / "Jetzt aktivieren")
 *
 * Initial aus dem Token (synchron, vermeidet Flash), per fetchMe bestätigt.
 * Wird als <a> gerendert, damit die vorhandenen Link-Styles 1:1 greifen.
 */
export default function SessionCta({ joinHref, joinLabel, className }: Props) {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    setAuthed(Boolean(getToken()));
    fetchMe().then((u) => { if (!cancelled) setAuthed(Boolean(u)); });
    return () => { cancelled = true; };
  }, []);

  if (authed) {
    return (
      <a
        className={className}
        href="/"
        onClick={(e) => { e.preventDefault(); logout(); window.location.assign("/"); }}
      >
        Logout
      </a>
    );
  }

  // null (erstes Render / SSR) oder false → Join-CTA als Standard
  return <a className={className} href={joinHref}>{joinLabel}</a>;
}
