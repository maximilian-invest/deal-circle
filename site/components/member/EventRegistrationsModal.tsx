"use client";
import { useEffect, useState } from "react";
import {
  listEventRegistrations,
  updateRegistration,
  deleteAllEventRegistrations,
  addMemberToEvent,
  type AdminRegistration,
  type GuestRegistration,
} from "./events";
import { listUsers, type AdminUser } from "./admin";
import type { EventDto } from "./types";

type Props = {
  event: EventDto;
  onClose: () => void;
  // Wird nach dem Loeschen aller Anmeldungen aufgerufen, damit die Event-Liste
  // (Teilnehmerzahl) im Admin neu geladen wird.
  onChanged?: () => void;
};

const STATUS_LABELS: Record<AdminRegistration["status"], string> = {
  reserved:  "Reserviert",
  paid:      "Bezahlt",
  waitlist:  "Warteliste",
  cancelled: "Storniert",
};

const STATUS_ORDER: AdminRegistration["status"][] = ["reserved", "paid", "waitlist", "cancelled"];

function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("de-AT", { day: "2-digit", month: "short", year: "numeric" }) +
         " · " +
         d.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" });
}

export default function EventRegistrationsModal({ event, onClose, onChanged }: Props) {
  const [regs, setRegs] = useState<AdminRegistration[] | null>(null);
  const [guests, setGuests] = useState<GuestRegistration[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [members, setMembers] = useState<AdminUser[] | null>(null);
  const [pickUserId, setPickUserId] = useState<string>("");
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const reload = async () => {
    try {
      setErr(null);
      const data = await listEventRegistrations(event.id);
      setRegs(data.registrations);
      setGuests(data.guests);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Anmeldungen nicht ladbar.");
    }
  };

  useEffect(() => { reload(); }, [event.id]);

  // Mitgliederliste für den "Mitglied hinzufügen"-Picker laden.
  useEffect(() => {
    listUsers()
      .then((us) => setMembers(us.filter((u) => u.role === "member")))
      .catch(() => setMembers([]));
  }, []);

  const onStatusChange = async (r: AdminRegistration, status: AdminRegistration["status"]) => {
    setSavingId(r.id);
    try {
      await updateRegistration(event.id, r.id, { status });
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Status-Update fehlgeschlagen.");
    } finally {
      setSavingId(null);
    }
  };

  const onDeleteAll = async () => {
    setDeleting(true);
    setErr(null);
    try {
      await deleteAllEventRegistrations(event.id);
      setConfirmDel(false);
      await reload();
      onChanged?.();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Löschen fehlgeschlagen.");
    } finally {
      setDeleting(false);
    }
  };

  const onAddMember = async () => {
    const uid = Number(pickUserId);
    if (!Number.isInteger(uid) || uid < 1) return;
    setAdding(true);
    setErr(null);
    setAddMsg(null);
    try {
      const r = await addMemberToEvent(event.id, uid);
      setPickUserId("");
      await reload();
      onChanged?.();
      setAddMsg(`${r.name || "Mitglied"} hinzugefügt — Bestätigungsmail gesendet.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(/already_registered/i.test(msg) ? "Dieses Mitglied ist bereits angemeldet." : "Hinzufügen fehlgeschlagen.");
    } finally {
      setAdding(false);
    }
  };

  const grouped = (() => {
    if (!regs) return null;
    const byStatus: Record<string, AdminRegistration[]> = {};
    for (const r of regs) {
      (byStatus[r.status] ||= []).push(r);
    }
    return byStatus;
  })();

  const counts = (() => {
    if (!regs) return null;
    return {
      reserved: regs.filter((r) => r.status === "reserved").length,
      paid:     regs.filter((r) => r.status === "paid").length,
      waitlist: regs.filter((r) => r.status === "waitlist").length,
      cancelled: regs.filter((r) => r.status === "cancelled").length,
      total: regs.length,
    };
  })();

  // Mitglieder, die noch nicht (bezahlt) angemeldet sind — nur die sind wählbar.
  const paidUserIds = new Set((regs ?? []).filter((r) => r.status === "paid").map((r) => r.user_id));
  const addableMembers = (members ?? []).filter((m) => !paidUserIds.has(m.id));

  return (
    <div className="mb-modal-backdrop" onClick={onClose}>
      <div className="mb-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ width: "min(820px, 100%)" }}>
        <div className="mb-modal-header">
          <div>
            <span className="mb-modal-eyebrow">Anmeldungen</span>
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
          {counts && (
            <div className="mb-regs-counts">
              <div className="mb-regs-count"><span>Gesamt</span><strong>{counts.total}</strong></div>
              <div className="mb-regs-count mb-regs-count--paid"><span>Bezahlt</span><strong>{counts.paid}</strong></div>
              <div className="mb-regs-count mb-regs-count--reserved"><span>Reserviert</span><strong>{counts.reserved}</strong></div>
              <div className="mb-regs-count mb-regs-count--waitlist"><span>Warteliste</span><strong>{counts.waitlist}</strong></div>
              <div className="mb-regs-count mb-regs-count--cancelled"><span>Storniert</span><strong>{counts.cancelled}</strong></div>
            </div>
          )}

          {/* Mitglied manuell hinzufügen */}
          <div className="mb-regs-add">
            <span className="mb-admin-eyebrow" style={{ display: "block", marginBottom: 8 }}>
              Mitglied hinzufügen
            </span>
            <div className="mb-regs-add-row">
              <select
                className="mb-admin-select"
                value={pickUserId}
                onChange={(e) => setPickUserId(e.target.value)}
                disabled={adding || members === null}
                style={{ flex: 1, minWidth: 0 }}
              >
                <option value="">{members === null ? "Mitglieder werden geladen …" : "Mitglied wählen …"}</option>
                {addableMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} · {m.email}</option>
                ))}
              </select>
              <button
                type="button"
                className="dc-btn dc-btn-primary"
                onClick={onAddMember}
                disabled={adding || !pickUserId}
              >
                {adding ? "Füge hinzu …" : "Hinzufügen"}
              </button>
            </div>
            <p className="mb-regs-add-note">
              Das Mitglied gilt als angemeldet und bekommt eine Bestätigungsmail mit Link zur Event-Seite.
            </p>
            {addMsg && <div className="mb-admin-alert mb-admin-alert--ok" style={{ marginTop: 10 }}>{addMsg}</div>}
          </div>

          {err && <div className="mb-admin-alert mb-admin-alert--error">{err}</div>}

          {regs === null && !err && (
            <div className="mb-admin-empty">Wird geladen …</div>
          )}

          {regs && regs.length === 0 && guests.length === 0 && (
            <div className="mb-admin-empty">
              Noch keine Anmeldungen. Sobald sich jemand über die Event-Seite einträgt, taucht er hier auf.
            </div>
          )}

          {grouped && regs && regs.length > 0 && (
            <div className="mb-regs-list">
              {STATUS_ORDER.filter((s) => grouped[s]?.length).map((status) => (
                <div key={status} className="mb-regs-group">
                  <span className="mb-admin-eyebrow" style={{ display: "block", marginBottom: 8 }}>
                    {STATUS_LABELS[status]} ({grouped[status].length})
                  </span>
                  <div className="mb-admin-table-wrap">
                    <table className="mb-admin-table">
                      <thead>
                        <tr>
                          <th>Wer</th>
                          <th>Kontakt</th>
                          <th>Ticket</th>
                          <th>Betrag</th>
                          <th>Angemeldet</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grouped[status].map((r) => (
                          <tr key={r.id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{r.name}</div>
                              {r.company && <div className="mb-admin-email">{r.company}</div>}
                            </td>
                            <td>
                              <div className="mb-admin-email">{r.email}</div>
                              {r.phone && <div className="mb-admin-email">{r.phone}</div>}
                            </td>
                            <td>{r.ticket_name ?? "—"}</td>
                            <td>
                              {r.amount_cents == null
                                ? "—"
                                : `€ ${Math.round(r.amount_cents / 100).toLocaleString("de-AT")}`}
                            </td>
                            <td>
                              <span className="mb-admin-email">
                                {fmtTime(r.created_at.replace(" ", "T") + "Z")}
                              </span>
                            </td>
                            <td>
                              <select
                                className="mb-admin-select"
                                value={r.status}
                                disabled={savingId === r.id}
                                onChange={(e) => onStatusChange(r, e.target.value as AdminRegistration["status"])}
                                style={{ minWidth: 130 }}
                              >
                                <option value="reserved">Reserviert</option>
                                <option value="paid">Bezahlt</option>
                                <option value="waitlist">Warteliste</option>
                                <option value="cancelled">Storniert</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {guests.length > 0 && (
            <div className="mb-regs-group" style={{ marginTop: 4 }}>
              <span className="mb-admin-eyebrow" style={{ display: "block", marginBottom: 8 }}>
                Gäste · ohne Login ({guests.length})
              </span>
              <div className="mb-admin-table-wrap">
                <table className="mb-admin-table">
                  <thead>
                    <tr>
                      <th>Wer</th>
                      <th>Kontakt</th>
                      <th>Ticket</th>
                      <th>Betrag</th>
                      <th>Reserviert</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guests.map((g) => (
                      <tr key={g.id}>
                        <td><div style={{ fontWeight: 600 }}>{g.name}</div></td>
                        <td><div className="mb-admin-email">{g.email}</div></td>
                        <td>{g.ticket_name ?? "—"}</td>
                        <td>{g.amount_cents == null ? "—" : `€ ${Math.round(g.amount_cents / 100).toLocaleString("de-AT")}`}</td>
                        <td><span className="mb-admin-email">{fmtTime(g.created_at.replace(" ", "T") + "Z")}</span></td>
                        <td><span className="mb-admin-email">{STATUS_LABELS[g.status]}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="mb-modal-foot">
          {confirmDel ? (
            <span className="mb-regs-confirm">
              <span className="mb-regs-confirm-q">
                Wirklich <b>alle {(regs?.length ?? 0) + guests.length}</b> Anmeldungen löschen? Das lässt sich nicht rückgängig machen.
              </span>
              <button type="button" className="dc-btn dc-btn-danger" onClick={onDeleteAll} disabled={deleting}>
                {deleting ? "Löschen …" : "Ja, alle löschen"}
              </button>
              <button type="button" className="dc-btn dc-btn-secondary" onClick={() => setConfirmDel(false)} disabled={deleting}>
                Abbrechen
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="dc-btn mb-regs-danger"
              onClick={() => setConfirmDel(true)}
              disabled={!regs || (regs.length + guests.length === 0)}
              title="Alle Mitglieder- und Gäste-Anmeldungen dieses Events löschen"
            >
              Alle Anmeldungen löschen
            </button>
          )}
          <button type="button" className="dc-btn dc-btn-secondary" onClick={onClose}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
