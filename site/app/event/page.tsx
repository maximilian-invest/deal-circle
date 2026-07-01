"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import EventLanding, { type EventDetail } from "../../components/EventLanding";
import { getToken } from "../../components/member/api";
import { login } from "../../components/member/auth";

type State =
  | { tag: "loading" }
  | { tag: "missing" }
  | { tag: "notfound" }
  | { tag: "needs_login" }
  | { tag: "error"; message: string }
  | { tag: "ok"; event: EventDetail };

function EventInner() {
  const params = useSearchParams();
  const id = params.get("id");

  const [state, setState] = useState<State>({ tag: "loading" });
  // Nach dem Login neu laden: nonce hochzählen → useEffect läuft erneut (jetzt mit Token).
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!id) { setState({ tag: "missing" }); return; }
    if (!/^\d+$/.test(id)) { setState({ tag: "notfound" }); return; }

    let cancelled = false;

    async function load() {
      setState({ tag: "loading" });
      try {
        const token = getToken();
        // 1) Öffentlicher Endpoint — funktioniert ohne Login.
        let r = await fetch(`/api/events/public/${id}`);
        //    403 = Event existiert, ist aber nur für Mitglieder.
        //    404 = nicht vorhanden oder versteckt.
        if ((r.status === 403 || r.status === 404) && token) {
          // Eingeloggt → über den Member-Endpoint nachladen (Mitglieder sehen es).
          r = await fetch(`/api/events/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        } else if (r.status === 403 && !token) {
          // Nur-Mitglieder-Event, nicht eingeloggt → Login anbieten.
          if (!cancelled) setState({ tag: "needs_login" });
          return;
        }
        if (cancelled) return;
        // Token abgelaufen/ungültig oder weiterhin gesperrt → Login anbieten.
        if (r.status === 401 || r.status === 403) { setState({ tag: "needs_login" }); return; }
        if (r.status === 404) { setState({ tag: "notfound" }); return; }
        if (!r.ok) { setState({ tag: "error", message: `HTTP ${r.status}` }); return; }
        const data = await r.json();
        if (!cancelled) setState({ tag: "ok", event: data.event });
      } catch (e) {
        if (!cancelled) setState({ tag: "error", message: e instanceof Error ? e.message : "Netzwerk-Fehler" });
      }
    }
    load();

    return () => { cancelled = true; };
  }, [id, nonce]);

  if (state.tag === "ok") return <EventLanding event={state.event} />;
  if (state.tag === "needs_login") return <EventLoginGate onLoggedIn={() => setNonce((n) => n + 1)} />;

  return (
    <div className="dc-ev-loader">
      <div className="dc-ev-loader-card">
        {state.tag === "loading" && <p>Event wird geladen …</p>}
        {state.tag === "missing" && (
          <>
            <h2>Kein Event ausgewählt</h2>
            <p>Bitte über einen Event-Link aufrufen.</p>
            <a href="/" className="dc-btn dc-btn-primary">Zur Startseite</a>
          </>
        )}
        {state.tag === "notfound" && (
          <>
            <h2>Event nicht gefunden</h2>
            <p>Das Event mit dieser ID existiert nicht.</p>
            <a href="/" className="dc-btn dc-btn-primary">Zur Startseite</a>
          </>
        )}
        {state.tag === "error" && (
          <>
            <h2>Fehler beim Laden</h2>
            <p>{state.message}</p>
            <a href="/" className="dc-btn dc-btn-primary">Zur Startseite</a>
          </>
        )}
      </div>
    </div>
  );
}

// Inline-Login direkt auf der Event-Seite: nach erfolgreichem Login wird das
// Event neu geladen und erscheint sofort (kein Umweg über den Login-Screen).
function EventLoginGate({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !pwd) { setError("Bitte E-Mail und Passwort angeben."); return; }
    setSubmitting(true);
    try {
      await login(email.trim(), pwd);
      onLoggedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Anmeldung fehlgeschlagen.");
      setSubmitting(false);
    }
  };

  return (
    <div className="dc-ev-loader">
      <div className="dc-ev-loader-card">
        <h2>Nur für Mitglieder</h2>
        <p>Dieses Event ist nur für angemeldete Mitglieder sichtbar. Melde dich an — danach zeigen wir dir das Event direkt hier.</p>
        <form onSubmit={onSubmit} noValidate style={{ width: "100%", textAlign: "left" }}>
          <div className="dc-field">
            <label htmlFor="ev-email">E-Mail</label>
            <input type="email" id="ev-email" autoComplete="email" placeholder="deine@adresse.at"
              value={email} onChange={(e) => setEmail(e.target.value)} disabled={submitting} required />
          </div>
          <div className="dc-field" style={{ marginTop: 12 }}>
            <label htmlFor="ev-pwd">Passwort</label>
            <input type="password" id="ev-pwd" autoComplete="current-password" placeholder="••••••••"
              value={pwd} onChange={(e) => setPwd(e.target.value)} disabled={submitting} required />
          </div>
          {error && <div className="mb-login-error" role="alert" style={{ marginTop: 12 }}>{error}</div>}
          <button type="submit" className="dc-btn dc-btn-primary dc-btn--lg" style={{ marginTop: 18, width: "100%" }} disabled={submitting}>
            {submitting ? "Anmelden …" : "Anmelden & Event ansehen"}
          </button>
        </form>
        <p style={{ fontSize: 13, marginTop: 4 }}>
          Passwort vergessen? <a href="/mitglieder/passwort-zuruecksetzen/" style={{ color: "var(--color-ink)" }}>Zurücksetzen</a>
          <span aria-hidden="true"> · </span>
          Noch kein Mitglied? <a href="/mitglied-werden/" style={{ color: "var(--color-ink)" }}>Antrag stellen</a>
        </p>
      </div>
    </div>
  );
}

export default function EventPage() {
  return (
    <Suspense fallback={<div className="dc-ev-loader"><div className="dc-ev-loader-card"><p>Event wird geladen …</p></div></div>}>
      <EventInner />
    </Suspense>
  );
}
