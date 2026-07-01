"use client";
import { useEffect, useState } from "react";
import { getMailStats, sendEventMail, type MailKind, type MailStats } from "./events";
import type { EventDto } from "./types";

type Props = {
  event: EventDto;
  onClose: () => void;
  onSent: (message: string) => void;
};

const KIND_INFO: Record<MailKind, { title: string; sub: string; icon: string }> = {
  announcement: {
    title: "Anmeldung jetzt möglich",
    sub: "Einladung an Mitglieder, die noch nicht gekauft haben",
    icon: "📨",
  },
  limited: {
    title: "Nur noch wenige Plätze",
    sub: "Knappheits-Reminder · an noch nicht gekaufte Mitglieder",
    icon: "⚠️",
  },
  soldout: {
    title: "Anmeldung geschlossen",
    sub: "Update an alle Mitglieder · Warteliste-Hinweis",
    icon: "🔒",
  },
};

// Vorschlag-Mapping je Event-Status
function suggestedKind(status: EventDto["status"]): MailKind {
  if (status === "limited")  return "limited";
  if (status === "waitlist") return "soldout";
  if (status === "closed")   return "soldout";
  return "announcement";
}

export default function EventMailModal({ event, onClose, onSent }: Props) {
  const [stats, setStats] = useState<MailStats | null>(null);
  const [kind, setKind] = useState<MailKind>(suggestedKind(event.status));
  // Standard: nur an Mitglieder, die noch nicht gekauft haben (Einladung/Reminder).
  // Bei "Ausgebucht"-Update geht es bewusst an alle Mitglieder.
  const [excludeRegistered, setExcludeRegistered] = useState(kind !== "soldout");
  const [testToSelf, setTestToSelf] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    getMailStats(event.id).then(setStats).catch(() => setStats({ member_count: 0, registered_count: 0, history: [] }));
  }, [event.id]);

  // Re-trigger exclude default wenn kind sich ändert
  useEffect(() => {
    setExcludeRegistered(kind !== "soldout");
  }, [kind]);

  const recipientCount = (() => {
    if (!stats) return null;
    if (testToSelf) return 1;
    if (excludeRegistered) return Math.max(0, stats.member_count - stats.registered_count);
    return stats.member_count;
  })();

  const onSend = async () => {
    setError(null);
    setResult(null);
    setSending(true);
    try {
      const r = await sendEventMail(event.id, { kind, exclude_registered: excludeRegistered, test_to_self: testToSelf });
      if (r.test) {
        // Test-Versand: Modal offen lassen, Ergebnis inline anzeigen
        setResult(`Test-Mail an dich gesendet (${r.label}).`);
        setSending(false);
      } else {
        // Live-Versand erfolgreich: Bestätigung hochreichen, Parent schließt das Modal
        const n = r.recipient_count;
        onSent(`${r.label}: an ${n} ${n === 1 ? "Mitglied" : "Mitglieder"} versendet.`);
        // kein weiteres setState — das Modal wird vom Parent unmounted
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Versand fehlgeschlagen.");
      setSending(false);
    }
  };

  return (
    <div className="mb-modal-backdrop" onClick={onClose}>
      <div className="mb-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="mb-modal-header">
          <div>
            <span className="mb-modal-eyebrow">Mail an Mitglieder</span>
            <h3 className="mb-modal-title">{event.title}</h3>
            <p className="mb-modal-sub" style={{ marginTop: 6 }}>
              {new Date(event.starts_at).toLocaleDateString("de-AT", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })} · {event.location}
            </p>
          </div>
          <button type="button" className="mb-modal-close" onClick={onClose} aria-label="Schließen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="mb-modal-body">
          {/* Vorlagen */}
          <div>
            <span className="mb-admin-eyebrow" style={{ display: "block", marginBottom: 10 }}>
              Vorlage
            </span>
            <div className="mb-mailkind-list">
              {(Object.keys(KIND_INFO) as MailKind[]).map((k) => (
                <label key={k} className="mb-mailkind" data-selected={kind === k ? "true" : "false"}>
                  <input
                    type="radio"
                    name="mailkind"
                    value={k}
                    checked={kind === k}
                    onChange={() => setKind(k)}
                  />
                  <span className="mb-mailkind-icon" aria-hidden="true">{KIND_INFO[k].icon}</span>
                  <span className="mb-mailkind-meta">
                    <span className="mb-mailkind-title">{KIND_INFO[k].title}</span>
                    <span className="mb-mailkind-sub">{KIND_INFO[k].sub}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Empfänger-Settings */}
          <div className="mb-mailopts">
            <label className="mb-mailopt">
              <input type="checkbox" checked={excludeRegistered} onChange={(e) => setExcludeRegistered(e.target.checked)} />
              <span>Nur an Mitglieder, die noch nicht gekauft haben</span>
            </label>
            <label className="mb-mailopt">
              <input type="checkbox" checked={testToSelf} onChange={(e) => setTestToSelf(e.target.checked)} />
              <span>Nur Test an dich selbst senden</span>
            </label>
          </div>

          {/* Empfänger-Zahl */}
          <div className="mb-mailcount">
            <span className="mb-admin-eyebrow">Empfänger</span>
            <span className="mb-mailcount-n">
              {stats == null ? "…" : `${recipientCount} ${recipientCount === 1 ? "Mitglied" : "Mitglieder"}`}
            </span>
            {stats && !testToSelf && (
              <span className="mb-mailcount-info">
                ({stats.member_count} Mitglieder, {stats.registered_count} haben schon gekauft)
              </span>
            )}
          </div>

          {/* Verlauf */}
          {stats && stats.history.length > 0 && (
            <div>
              <span className="mb-admin-eyebrow" style={{ display: "block", marginBottom: 8 }}>
                Bisher gesendet
              </span>
              <ul className="mb-mailhistory">
                {stats.history.map((h) => (
                  <li key={h.id}>
                    <span className="mb-mailhistory-kind">{KIND_INFO[h.kind]?.title || h.kind}</span>
                    <span className="mb-mailhistory-time">
                      {new Date(h.created_at.replace(" ", "T") + "Z").toLocaleString("de-AT", {
                        day: "2-digit", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                    <span className="mb-mailhistory-count">{h.recipient_count} Empfänger</span>
                    {h.triggered_by_name && (
                      <span className="mb-mailhistory-by">— {h.triggered_by_name}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && <div className="mb-admin-alert mb-admin-alert--error">{error}</div>}
          {result && <div className="mb-admin-alert mb-admin-alert--ok">{result}</div>}
        </div>

        <div className="mb-modal-foot">
          <span className="mb-modal-foot-note">
            Mail-Versand läuft asynchron — bei großen Listen kann es bis zu einer Minute dauern.
          </span>
          <button
            type="button"
            className="dc-btn dc-btn-primary dc-btn--lg"
            onClick={onSend}
            disabled={sending || recipientCount === 0}
          >
            {sending ? "Sende …" :
              testToSelf ? "Test an dich senden" :
              `An ${recipientCount} senden`}
          </button>
        </div>
      </div>
    </div>
  );
}
