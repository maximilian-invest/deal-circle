"use client";
import { useEffect, useState } from "react";
import { listMyRegistrations, type MyRegistration } from "./events";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("de-AT", {
    weekday: "short", day: "numeric", month: "long", year: "numeric",
  }) + " · " + d.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_LABELS: Record<string, string> = {
  reserved:  "Reserviert · Bezahlung folgt",
  paid:      "Bezahlt",
  waitlist:  "Warteliste",
  cancelled: "Storniert",
};

export default function MyRegistrations() {
  const [regs, setRegs] = useState<MyRegistration[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    listMyRegistrations()
      .then(setRegs)
      .catch((e) => setErr(e instanceof Error ? e.message : "Anmeldungen nicht ladbar."));
  }, []);

  if (err)  return null; // silently — wichtige Sections sind oberhalb
  if (!regs || regs.length === 0) return null;

  const active = regs.filter((r) => r.status !== "cancelled");
  if (active.length === 0) return null;

  return (
    <section className="mb-section">
      <div className="mb-section-head">
        <h2 className="mb-section-title">Deine Anmeldungen.</h2>
      </div>
      <div className="mb-myregs">
        {active.map((r) => (
          <a key={r.id} className="mb-myreg" href={`/event/?id=${r.event_id}`}>
            <div className="mb-myreg-date">{fmtDate(r.starts_at)}</div>
            <div className="mb-myreg-title">{r.event_title}</div>
            <div className="mb-myreg-meta">
              <span>{r.location}</span>
              {r.ticket_name && <span>· {r.ticket_name}</span>}
              {r.amount_cents != null && (
                <span>· € {Math.round(r.amount_cents / 100).toLocaleString("de-AT")}</span>
              )}
            </div>
            <span className={`mb-myreg-status mb-myreg-status--${r.status}`}>
              {STATUS_LABELS[r.status] || r.status}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
