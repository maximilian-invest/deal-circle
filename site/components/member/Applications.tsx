"use client";
import { useEffect, useState } from "react";
import {
  listApplications, acceptApplication, rejectApplication, type Application,
} from "../applications";

function fmtDate(s: string): string {
  const d = new Date(s.includes("T") ? s : s.replace(" ", "T") + "Z");
  return isNaN(d.getTime())
    ? s
    : d.toLocaleDateString("de-AT", { day: "numeric", month: "long", year: "numeric" });
}
function normUrl(u: string): string {
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-app-field">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export default function Applications() {
  const [apps, setApps] = useState<Application[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listApplications("pending")
      .then((r) => { if (!cancelled) setApps(r.applications); })
      .catch((e) => { if (!cancelled) setLoadError(e instanceof Error ? e.message : "Anträge nicht ladbar."); });
    return () => { cancelled = true; };
  }, []);

  const onAccept = async (a: Application) => {
    if (busyId) return;
    setBusyId(a.id); setActionError(null); setDoneMsg(null);
    try {
      await acceptApplication(a.id);
      setApps((list) => (list ?? []).filter((x) => x.id !== a.id));
      setDoneMsg(`${a.name} aufgenommen — die Einladung mit Zugangslink ist unterwegs.`);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Annehmen fehlgeschlagen.");
    } finally {
      setBusyId(null);
    }
  };

  const onReject = async (a: Application) => {
    if (busyId) return;
    if (!window.confirm(`Antrag von ${a.name} ablehnen?`)) return;
    setBusyId(a.id); setActionError(null); setDoneMsg(null);
    try {
      await rejectApplication(a.id);
      setApps((list) => (list ?? []).filter((x) => x.id !== a.id));
      setDoneMsg(`Antrag von ${a.name} abgelehnt.`);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Ablehnen fehlgeschlagen.");
    } finally {
      setBusyId(null);
    }
  };

  if (loadError) {
    return <div className="mb-admin"><div className="mb-admin-alert mb-admin-alert--error">{loadError}</div></div>;
  }
  if (!apps) {
    return <div className="mb-admin"><div className="mb-admin-empty">Anträge werden geladen …</div></div>;
  }

  return (
    <div className="mb-admin">
      {doneMsg && <div className="mb-admin-alert mb-admin-alert--ok">{doneMsg}</div>}
      {actionError && <div className="mb-admin-alert mb-admin-alert--error">{actionError}</div>}

      {apps.length === 0 ? (
        <div className="mb-admin-empty">
          Keine offenen Anträge. Neue Aufnahme-Anträge erscheinen hier automatisch.
        </div>
      ) : (
        <div className="mb-app-list">
          {apps.map((a) => (
            <article key={a.id} className="mb-admin-card mb-app">
              <header className="mb-app-head">
                <div>
                  <h3 className="mb-admin-card-title">{a.name}</h3>
                  <span className="mb-app-sub">
                    {a.company}{a.role ? ` · ${a.role}` : ""}
                  </span>
                </div>
                <span className="mb-app-date">{fmtDate(a.created_at)}</span>
              </header>

              <dl className="mb-app-meta">
                <Field label="E-Mail"><a href={`mailto:${a.email}`}>{a.email}</a></Field>
                <Field label="Telefon"><a href={`tel:${a.phone}`}>{a.phone}</a></Field>
                <Field label="Adresse">
                  {a.street}, {a.postal_code} {a.city}{a.country ? `, ${a.country}` : ""}
                </Field>
                {a.website && (
                  <Field label="Website">
                    <a href={normUrl(a.website)} target="_blank" rel="noopener noreferrer">{a.website}</a>
                  </Field>
                )}
                {a.referral && <Field label="Empfohlen von">{a.referral}</Field>}
              </dl>

              <div className="mb-app-about">
                <span className="mb-admin-eyebrow">Über sich</span>
                <p>{a.about}</p>
              </div>

              <div className="mb-app-actions">
                <button
                  type="button"
                  className="dc-btn dc-btn-secondary"
                  onClick={() => onReject(a)}
                  disabled={busyId === a.id}
                >
                  Ablehnen
                </button>
                <button
                  type="button"
                  className="dc-btn dc-btn-primary"
                  onClick={() => onAccept(a)}
                  disabled={busyId === a.id}
                >
                  {busyId === a.id ? "Wird aufgenommen …" : "Aufnehmen"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
