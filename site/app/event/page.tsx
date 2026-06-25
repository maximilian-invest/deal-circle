"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import EventLanding, { type EventDetail } from "../../components/EventLanding";
import { getToken } from "../../components/member/api";

type State =
  | { tag: "loading" }
  | { tag: "missing" }
  | { tag: "notfound" }
  | { tag: "error"; message: string }
  | { tag: "ok"; event: EventDetail };

function EventInner() {
  const params = useSearchParams();
  const id = params.get("id");

  const [state, setState] = useState<State>({ tag: "loading" });

  useEffect(() => {
    if (!id) { setState({ tag: "missing" }); return; }
    if (!/^\d+$/.test(id)) { setState({ tag: "notfound" }); return; }

    let cancelled = false;

    async function load() {
      try {
        // 1) Öffentlicher Endpoint — funktioniert ohne Login.
        let r = await fetch(`/api/events/public/${id}`);
        // 2) Nur-Mitglieder-Event? Liefert 404 öffentlich → mit Token über den
        //    Member-Endpoint nachladen (eingeloggte Mitglieder sehen es).
        if (r.status === 404) {
          const token = getToken();
          if (token) {
            r = await fetch(`/api/events/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        }
        if (cancelled) return;
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
  }, [id]);

  if (state.tag === "ok") return <EventLanding event={state.event} />;

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

export default function EventPage() {
  return (
    <Suspense fallback={<div className="dc-ev-loader"><div className="dc-ev-loader-card"><p>Event wird geladen …</p></div></div>}>
      <EventInner />
    </Suspense>
  );
}
