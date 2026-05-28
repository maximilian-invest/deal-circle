"use client";
import { useEffect, useState } from "react";
import {
  createEvent,
  deleteEvent,
  listEvents,
  updateEvent,
  type CreateEventInput,
} from "./events";
import type { EventDto, EventStatusApi } from "./types";

type FormState = {
  title: string;
  starts_at_local: string;        // value für <input type="datetime-local">
  time_label: string;
  location: string;
  status: EventStatusApi;
  fee_eur: string;
  max_attendees: string;
  confirmed_count: string;
  description: string;
  speaker: string;
  photo_count: string;
};

const EMPTY: FormState = {
  title: "",
  starts_at_local: "",
  time_label: "18:30 – 22:30",
  location: "Schloss Wiespach, Hallein",
  status: "open",
  fee_eur: "380",
  max_attendees: "32",
  confirmed_count: "0",
  description: "",
  speaker: "",
  photo_count: "0",
};

const STATUS_LABELS: Record<EventStatusApi, string> = {
  open:     "Anmeldung offen",
  limited:  "Wenige Plätze",
  waitlist: "Warteliste",
  closed:   "Abgeschlossen",
};

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string): string {
  // local: "2026-06-15T18:30" → ISO 8601 in UTC
  const d = new Date(local);
  return d.toISOString();
}

function toForm(e: EventDto): FormState {
  return {
    title: e.title,
    starts_at_local: toLocalInput(e.starts_at),
    time_label: e.time_label,
    location: e.location,
    status: e.status,
    fee_eur: String(Math.round(e.fee_cents / 100)),
    max_attendees: e.max_attendees == null ? "" : String(e.max_attendees),
    confirmed_count: String(e.confirmed_count),
    description: e.description ?? "",
    speaker: e.speaker ?? "",
    photo_count: String(e.photo_count),
  };
}

function fromForm(f: FormState): CreateEventInput {
  return {
    title: f.title.trim(),
    starts_at: fromLocalInput(f.starts_at_local),
    time_label: f.time_label.trim(),
    location: f.location.trim(),
    status: f.status,
    fee_cents: Math.round(Number(f.fee_eur || "0") * 100),
    max_attendees: f.max_attendees.trim() === "" ? null : Number(f.max_attendees),
    confirmed_count: Number(f.confirmed_count || "0"),
    description: f.description.trim() ? f.description.trim() : null,
    speaker: f.speaker.trim() ? f.speaker.trim() : null,
    photo_count: Number(f.photo_count || "0"),
  };
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("de-AT", { day: "2-digit", month: "short", year: "numeric" }) +
         " · " +
         d.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" });
}

export default function EventsAdmin() {
  const [events, setEvents] = useState<EventDto[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const reload = async () => {
    try {
      setLoadError(null);
      const list = await listEvents();
      setEvents(list);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Konnte Events nicht laden.");
    }
  };

  useEffect(() => { reload(); }, []);

  const startNew = () => {
    const now = new Date();
    now.setDate(now.getDate() + 14);
    now.setHours(18, 30, 0, 0);
    setEditingId("new");
    setForm({ ...EMPTY, starts_at_local: toLocalInput(now.toISOString()) });
    setFormError(null);
    setNotice(null);
  };

  const startEdit = (e: EventDto) => {
    setEditingId(e.id);
    setForm(toForm(e));
    setFormError(null);
    setNotice(null);
  };

  const cancel = () => {
    setEditingId(null);
    setForm(EMPTY);
    setFormError(null);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setNotice(null);

    if (!form.title.trim() || !form.starts_at_local || !form.location.trim()) {
      setFormError("Titel, Datum und Ort sind Pflichtfelder.");
      return;
    }

    let input: CreateEventInput;
    try {
      input = fromForm(form);
    } catch {
      setFormError("Bitte Datum/Uhrzeit prüfen.");
      return;
    }

    setSaving(true);
    try {
      if (editingId === "new") {
        const created = await createEvent(input);
        setNotice(`Event "${created.title}" angelegt.`);
      } else if (typeof editingId === "number") {
        const updated = await updateEvent(editingId, input);
        setNotice(`Event "${updated.title}" aktualisiert.`);
      }
      await reload();
      setEditingId(null);
      setForm(EMPTY);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (ev: EventDto) => {
    if (!confirm(`Event "${ev.title}" wirklich löschen?`)) return;
    try {
      await deleteEvent(ev.id);
      setNotice(`Event "${ev.title}" gelöscht.`);
      await reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Löschen fehlgeschlagen.");
    }
  };

  return (
    <div className="mb-admin">
      <section className="mb-admin-card">
        <header className="mb-admin-card-head">
          <div>
            <span className="mb-admin-eyebrow">Events</span>
            <h3 className="mb-admin-card-title">
              {editingId === "new" ? "Neues Event anlegen" :
                typeof editingId === "number" ? "Event bearbeiten" :
                "Events verwalten"}
            </h3>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="dc-btn dc-btn-secondary" onClick={reload}>
              Aktualisieren
            </button>
            {editingId === null && (
              <button type="button" className="dc-btn dc-btn-primary" onClick={startNew}>
                + Neues Event
              </button>
            )}
          </div>
        </header>

        {notice && <div className="mb-admin-alert mb-admin-alert--ok">{notice}</div>}

        {editingId !== null && (
          <form className="mb-admin-form" onSubmit={onSubmit} noValidate>
            <div className="dc-field">
              <label htmlFor="ev-title">Titel</label>
              <input
                id="ev-title"
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="z. B. Wiespach LXVIII · Energie & Infrastruktur."
                required
              />
            </div>

            <div className="mb-admin-form-row">
              <div className="dc-field">
                <label htmlFor="ev-starts">Datum & Beginn</label>
                <input
                  id="ev-starts"
                  type="datetime-local"
                  value={form.starts_at_local}
                  onChange={(e) => setForm({ ...form, starts_at_local: e.target.value })}
                  required
                />
              </div>
              <div className="dc-field">
                <label htmlFor="ev-time-label">Zeit-Label</label>
                <input
                  id="ev-time-label"
                  type="text"
                  value={form.time_label}
                  onChange={(e) => setForm({ ...form, time_label: e.target.value })}
                  placeholder="18:30 – 22:30  /  Ganztägig  /  Mehrtägig"
                  required
                />
              </div>
            </div>

            <div className="mb-admin-form-row">
              <div className="dc-field">
                <label htmlFor="ev-location">Ort</label>
                <input
                  id="ev-location"
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Schloss Wiespach, Hallein"
                  required
                />
              </div>
              <div className="dc-field">
                <label htmlFor="ev-status">Status</label>
                <select
                  id="ev-status"
                  className="mb-admin-select"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as EventStatusApi })}
                >
                  <option value="open">Anmeldung offen</option>
                  <option value="limited">Wenige Plätze</option>
                  <option value="waitlist">Warteliste</option>
                  <option value="closed">Abgeschlossen (z. B. vergangen)</option>
                </select>
              </div>
            </div>

            <div className="mb-admin-form-row">
              <div className="dc-field">
                <label htmlFor="ev-fee">Teilnahmebeitrag (€)</label>
                <input
                  id="ev-fee"
                  type="number"
                  min="0"
                  step="1"
                  value={form.fee_eur}
                  onChange={(e) => setForm({ ...form, fee_eur: e.target.value })}
                />
              </div>
              <div className="dc-field">
                <label htmlFor="ev-max">Max. Teilnehmer (optional)</label>
                <input
                  id="ev-max"
                  type="number"
                  min="0"
                  step="1"
                  value={form.max_attendees}
                  onChange={(e) => setForm({ ...form, max_attendees: e.target.value })}
                  placeholder="z. B. 32"
                />
              </div>
            </div>

            <div className="mb-admin-form-row">
              <div className="dc-field">
                <label htmlFor="ev-confirmed">Bestätigt / Anwesend</label>
                <input
                  id="ev-confirmed"
                  type="number"
                  min="0"
                  step="1"
                  value={form.confirmed_count}
                  onChange={(e) => setForm({ ...form, confirmed_count: e.target.value })}
                />
              </div>
              <div className="dc-field">
                <label htmlFor="ev-photos">Fotos-Anzahl (für vergangene Events)</label>
                <input
                  id="ev-photos"
                  type="number"
                  min="0"
                  step="1"
                  value={form.photo_count}
                  onChange={(e) => setForm({ ...form, photo_count: e.target.value })}
                />
              </div>
            </div>

            <div className="dc-field">
              <label htmlFor="ev-speaker">Vortragende / Themenkurz (optional)</label>
              <input
                id="ev-speaker"
                type="text"
                value={form.speaker}
                onChange={(e) => setForm({ ...form, speaker: e.target.value })}
                placeholder="z. B. Vortrag: Tech-Investor aus München"
              />
            </div>

            <div className="dc-field">
              <label htmlFor="ev-desc">Beschreibung (optional)</label>
              <textarea
                id="ev-desc"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Zwei, drei Sätze worum's geht — wird im Event-Detail angezeigt."
              />
            </div>

            {formError && <div className="mb-admin-alert mb-admin-alert--error">{formError}</div>}

            <div className="mb-admin-form-foot">
              <button type="button" className="dc-btn dc-btn-secondary" onClick={cancel} disabled={saving}>
                Abbrechen
              </button>
              <button type="submit" className="dc-btn dc-btn-primary" disabled={saving}>
                {saving ? "Speichern …" : (editingId === "new" ? "Event anlegen" : "Speichern")}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="mb-admin-card">
        <header className="mb-admin-card-head">
          <div>
            <span className="mb-admin-eyebrow">Liste</span>
            <h3 className="mb-admin-card-title">
              Alle Events {events ? `(${events.length})` : ""}
            </h3>
          </div>
        </header>

        {loadError && <div className="mb-admin-alert mb-admin-alert--error">{loadError}</div>}
        {events === null && !loadError && <div className="mb-admin-empty">Wird geladen …</div>}
        {events && events.length === 0 && (
          <div className="mb-admin-empty">Noch keine Events. Lege oben das erste an.</div>
        )}

        {events && events.length > 0 && (
          <div className="mb-admin-table-wrap">
            <table className="mb-admin-table">
              <thead>
                <tr>
                  <th>Wann</th>
                  <th>Titel</th>
                  <th>Ort</th>
                  <th>Status</th>
                  <th>Beitrag</th>
                  <th>Best./Max</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => {
                  const past = new Date(e.starts_at).getTime() < Date.now();
                  return (
                    <tr key={e.id} style={past ? { opacity: 0.7 } : undefined}>
                      <td><span className="mb-admin-email">{fmtDate(e.starts_at)}</span></td>
                      <td>{e.title}</td>
                      <td>{e.location}</td>
                      <td>
                        <span className={`mb-admin-role mb-admin-role--${e.status === "closed" ? "member" : "admin"}`}>
                          {STATUS_LABELS[e.status]}
                        </span>
                      </td>
                      <td>€ {Math.round(e.fee_cents / 100).toLocaleString("de-AT")}</td>
                      <td>{e.confirmed_count}{e.max_attendees != null ? ` / ${e.max_attendees}` : ""}</td>
                      <td>
                        <div className="mb-admin-actions">
                          <button
                            type="button"
                            className="mb-admin-action"
                            onClick={() => startEdit(e)}
                            disabled={editingId !== null}
                          >
                            Bearbeiten
                          </button>
                          <button
                            type="button"
                            className="mb-admin-action mb-admin-action--danger"
                            onClick={() => onDelete(e)}
                            disabled={editingId !== null}
                          >
                            Löschen
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
