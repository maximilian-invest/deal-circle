"use client";
import { useEffect, useRef, useState } from "react";
import {
  createEvent,
  deleteEvent,
  listEvents,
  updateEvent,
  uploadCoverImage,
  uploadImage,
  uploadSpeakerPhoto,
  type CreateEventInput,
} from "./events";
import type { EventDto, EventStatusApi, Speaker, Ticket, TimelineItem } from "./types";
import EventMailModal from "./EventMailModal";
import EventRegistrationsModal from "./EventRegistrationsModal";

type FormTicket = {
  id?: number;
  name: string;
  badge: string;
  featured: boolean;
  price_eur: string;
  perks: string[];
};

type FormState = {
  title: string;
  date_local: string;
  time_local: string;
  location: string;
  status: EventStatusApi;
  fee_eur: string;
  max_attendees: string;
  description: string;
  cover_path: string | null;
  timeline: TimelineItem[];
  speakers: Speaker[];
  tickets: FormTicket[];
};

const DEFAULT_PERKS = [
  "Zugang zu allen Keynotes",
  "Mehrgang-Dinner & Getränke",
  "Kuratiertes Networking",
];

const EMPTY: FormState = {
  title: "",
  date_local: "",
  time_local: "18:30",
  location: "Schloss Wiespach, Hallein",
  status: "open",
  fee_eur: "380",
  max_attendees: "32",
  description: "",
  cover_path: null,
  timeline: [],
  speakers: [],
  tickets: [],
};

const STATUS_LABELS: Record<EventStatusApi, string> = {
  open:     "Anmeldung offen",
  limited:  "Wenige Plätze",
  waitlist: "Warteliste",
  closed:   "Abgeschlossen",
};

function pad(n: number) { return String(n).padStart(2, "0"); }

function toForm(e: EventDto): FormState {
  const d = new Date(e.starts_at);
  return {
    title: e.title,
    date_local: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time_local: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    location: e.location,
    status: e.status,
    fee_eur: String(Math.round(e.fee_cents / 100)),
    max_attendees: e.max_attendees == null ? "" : String(e.max_attendees),
    description: e.description ?? "",
    cover_path: e.cover_path,
    timeline: e.timeline.map((t) => ({ id: t.id, time_label: t.time_label, label: t.label })),
    speakers: e.speakers.map((s) => ({ id: s.id, name: s.name, bio: s.bio, photo_path: s.photo_path })),
    tickets: (e.tickets ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      badge: t.badge ?? "",
      featured: !!t.featured,
      price_eur: String(Math.round(t.price_cents / 100)),
      perks: [...t.perks],
    })),
  };
}

function fromForm(f: FormState): CreateEventInput {
  const iso = new Date(`${f.date_local}T${f.time_local}:00`).toISOString();
  return {
    title: f.title.trim(),
    starts_at: iso,
    location: f.location.trim(),
    status: f.status,
    fee_cents: Math.round(Number(f.fee_eur || "0") * 100),
    max_attendees: f.max_attendees.trim() === "" ? null : Number(f.max_attendees),
    description: f.description.trim() ? f.description.trim() : null,
    cover_path: f.cover_path,
    timeline: f.timeline
      .filter((t) => t.time_label.trim() && t.label.trim())
      .map((t) => ({ time_label: t.time_label.trim(), label: t.label.trim() })),
    speakers: f.speakers
      .filter((s) => s.name.trim())
      .map((s) => ({
        name: s.name.trim(),
        bio: s.bio?.trim() ? s.bio.trim() : null,
        photo_path: s.photo_path || null,
      })),
    tickets: f.tickets
      .filter((t) => t.name.trim())
      .map((t) => ({
        name: t.name.trim(),
        badge: t.badge.trim() ? t.badge.trim() : null,
        featured: t.featured,
        price_cents: Math.round(Number(t.price_eur || "0") * 100),
        perks: t.perks.map((p) => p.trim()).filter(Boolean),
      })),
  };
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("de-AT", { day: "2-digit", month: "short", year: "numeric" }) +
         " · " +
         d.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" });
}

function ImagePicker({
  kind, photo, onUpload, onRemove, variant = "square", label = "Foto wählen",
}: {
  kind: "speaker" | "cover";
  photo: string | null;
  onUpload: (path: string) => void;
  onRemove: () => void;
  variant?: "square" | "wide";
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      const path = await uploadImage(kind, file);
      onUpload(path);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Upload fehlgeschlagen");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={`mb-speaker-photo mb-speaker-photo--${variant}`}>
      {photo ? (
        <div className="mb-speaker-photo-thumb">
          <img src={photo} alt="" />
          <button type="button" className="mb-speaker-photo-remove" onClick={onRemove} title="Bild entfernen">×</button>
        </div>
      ) : (
        <button type="button" className="mb-speaker-photo-empty" onClick={pick} disabled={busy}>
          {busy ? "Lädt …" : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <span>{label}</span>
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onFile}
        style={{ display: "none" }}
      />
      {err && <div className="mb-admin-alert mb-admin-alert--error" style={{ marginTop: 6 }}>{err}</div>}
    </div>
  );
}

// Backwards-compat fuer bestehende SpeakerCards
function SpeakerPhoto(props: { photo: string | null; onUpload: (p: string) => void; onRemove: () => void }) {
  return <ImagePicker kind="speaker" variant="square" label="Foto wählen" {...props} />;
}

export default function EventsAdmin() {
  const [events, setEvents] = useState<EventDto[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mailEvent, setMailEvent] = useState<EventDto | null>(null);
  const [regsEvent, setRegsEvent] = useState<EventDto | null>(null);

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
    setEditingId("new");
    setForm({
      ...EMPTY,
      date_local: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    });
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

  const addTimeline = () => setForm((f) => ({
    ...f,
    timeline: [...f.timeline, { time_label: "", label: "" }],
  }));
  const updateTimeline = (i: number, patch: Partial<TimelineItem>) => setForm((f) => ({
    ...f,
    timeline: f.timeline.map((t, idx) => idx === i ? { ...t, ...patch } : t),
  }));
  const removeTimeline = (i: number) => setForm((f) => ({
    ...f,
    timeline: f.timeline.filter((_, idx) => idx !== i),
  }));

  const addTicket = () => setForm((f) => ({
    ...f,
    tickets: [...f.tickets, {
      name: "Standard",
      badge: "Standard",
      featured: false,
      price_eur: f.fee_eur || "300",
      perks: [...DEFAULT_PERKS],
    }],
  }));
  const updateTicket = (i: number, patch: Partial<FormTicket>) => setForm((f) => ({
    ...f,
    tickets: f.tickets.map((t, idx) => idx === i ? { ...t, ...patch } : t),
  }));
  const removeTicket = (i: number) => setForm((f) => ({
    ...f,
    tickets: f.tickets.filter((_, idx) => idx !== i),
  }));
  const addPerk = (ticketIdx: number) => setForm((f) => ({
    ...f,
    tickets: f.tickets.map((t, idx) => idx === ticketIdx ? { ...t, perks: [...t.perks, ""] } : t),
  }));
  const updatePerk = (ticketIdx: number, perkIdx: number, value: string) => setForm((f) => ({
    ...f,
    tickets: f.tickets.map((t, idx) =>
      idx === ticketIdx ? { ...t, perks: t.perks.map((p, j) => j === perkIdx ? value : p) } : t
    ),
  }));
  const removePerk = (ticketIdx: number, perkIdx: number) => setForm((f) => ({
    ...f,
    tickets: f.tickets.map((t, idx) =>
      idx === ticketIdx ? { ...t, perks: t.perks.filter((_, j) => j !== perkIdx) } : t
    ),
  }));

  const addSpeaker = () => setForm((f) => ({
    ...f,
    speakers: [...f.speakers, { name: "", bio: "", photo_path: null }],
  }));
  const updateSpeaker = (i: number, patch: Partial<Speaker>) => setForm((f) => ({
    ...f,
    speakers: f.speakers.map((s, idx) => idx === i ? { ...s, ...patch } : s),
  }));
  const removeSpeaker = (i: number) => setForm((f) => ({
    ...f,
    speakers: f.speakers.filter((_, idx) => idx !== i),
  }));

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setNotice(null);

    if (!form.title.trim() || !form.date_local || !form.time_local || !form.location.trim()) {
      setFormError("Titel, Datum, Uhrzeit und Ort sind Pflichtfelder.");
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
                <label htmlFor="ev-date">Datum</label>
                <input
                  id="ev-date"
                  type="date"
                  value={form.date_local}
                  onChange={(e) => setForm({ ...form, date_local: e.target.value })}
                  required
                />
              </div>
              <div className="dc-field">
                <label htmlFor="ev-time">Uhrzeit (Beginn)</label>
                <input
                  id="ev-time"
                  type="time"
                  value={form.time_local}
                  onChange={(e) => setForm({ ...form, time_local: e.target.value })}
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
                  <option value="closed">Abgeschlossen</option>
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

            <div className="dc-field">
              <label htmlFor="ev-desc">Beschreibung</label>
              <textarea
                id="ev-desc"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Zwei, drei Sätze worum's geht."
              />
            </div>

            <div className="dc-field">
              <label>Titelbild</label>
              <ImagePicker
                kind="cover"
                variant="wide"
                label="Titelbild wählen (16:9, JPG/PNG, max. 8 MB)"
                photo={form.cover_path}
                onUpload={(path) => setForm({ ...form, cover_path: path })}
                onRemove={() => setForm({ ...form, cover_path: null })}
              />
            </div>

            <div className="mb-admin-section">
              <div className="mb-admin-section-head">
                <span className="mb-admin-eyebrow">Programm</span>
                <button type="button" className="mb-admin-action mb-admin-action--add" onClick={addTimeline}>
                  + Punkt hinzufügen
                </button>
              </div>

              {form.timeline.length === 0 ? (
                <div className="mb-admin-empty-row">Noch keine Programmpunkte. Empfang, Vortrag, Dinner …</div>
              ) : (
                <div className="mb-timeline-list">
                  {form.timeline.map((item, i) => (
                    <div key={i} className="mb-timeline-row">
                      <input
                        type="text"
                        className="mb-timeline-time"
                        value={item.time_label}
                        onChange={(e) => updateTimeline(i, { time_label: e.target.value })}
                        placeholder="18:30"
                      />
                      <input
                        type="text"
                        className="mb-timeline-label"
                        value={item.label}
                        onChange={(e) => updateTimeline(i, { label: e.target.value })}
                        placeholder="Empfang & Aperitif"
                      />
                      <button
                        type="button"
                        className="mb-timeline-remove"
                        onClick={() => removeTimeline(i)}
                        aria-label="Entfernen"
                        title="Entfernen"
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-admin-section">
              <div className="mb-admin-section-head">
                <span className="mb-admin-eyebrow">Vortragende</span>
                <button type="button" className="mb-admin-action mb-admin-action--add" onClick={addSpeaker}>
                  + Vortragende:n hinzufügen
                </button>
              </div>

              {form.speakers.length === 0 ? (
                <div className="mb-admin-empty-row">Noch keine Vortragenden eingetragen.</div>
              ) : (
                <div className="mb-speakers-list">
                  {form.speakers.map((sp, i) => (
                    <div key={i} className="mb-speaker-card">
                      <SpeakerPhoto
                        photo={sp.photo_path}
                        onUpload={(path) => updateSpeaker(i, { photo_path: path })}
                        onRemove={() => updateSpeaker(i, { photo_path: null })}
                      />
                      <div className="mb-speaker-fields">
                        <input
                          type="text"
                          className="mb-speaker-name"
                          value={sp.name}
                          onChange={(e) => updateSpeaker(i, { name: e.target.value })}
                          placeholder="Name (z. B. Walter Temmer)"
                        />
                        <textarea
                          className="mb-speaker-bio"
                          rows={3}
                          value={sp.bio ?? ""}
                          onChange={(e) => updateSpeaker(i, { bio: e.target.value })}
                          placeholder="Kurze Bio — woher, was macht die Person, warum spricht sie."
                        />
                      </div>
                      <button
                        type="button"
                        className="mb-speaker-remove"
                        onClick={() => removeSpeaker(i)}
                        aria-label="Vortragende entfernen"
                        title="Vortragende entfernen"
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-admin-section">
              <div className="mb-admin-section-head">
                <span className="mb-admin-eyebrow">Tickets & Preise</span>
                <button type="button" className="mb-admin-action mb-admin-action--add" onClick={addTicket}>
                  + Ticket-Variante hinzufügen
                </button>
              </div>

              {form.tickets.length === 0 ? (
                <div className="mb-admin-empty-row">
                  Noch keine Tickets — füg mindestens eines hinzu (z.&nbsp;B. Standard und VIP).
                  Solange leer, fällt die Event-Page auf den Default-Preis ({form.fee_eur} €) mit
                  Standard-Inhalten zurück.
                </div>
              ) : (
                <div className="mb-ticket-list">
                  {form.tickets.map((t, ti) => (
                    <div key={ti} className={`mb-ticket-card${t.featured ? " is-featured" : ""}`}>
                      <div className="mb-ticket-head">
                        <div className="mb-ticket-head-fields">
                          <input
                            type="text"
                            className="mb-ticket-name"
                            value={t.name}
                            onChange={(e) => updateTicket(ti, { name: e.target.value })}
                            placeholder="Name: Einzelplatz / VIP / Tisch"
                          />
                          <div className="mb-ticket-price-row">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              className="mb-ticket-price"
                              value={t.price_eur}
                              onChange={(e) => updateTicket(ti, { price_eur: e.target.value })}
                              placeholder="300"
                            />
                            <span className="mb-ticket-price-unit">€</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="mb-speaker-remove"
                          onClick={() => removeTicket(ti)}
                          title="Ticket-Variante entfernen"
                          aria-label="Ticket entfernen"
                        >×</button>
                      </div>

                      <div className="mb-ticket-head-fields">
                        <input
                          type="text"
                          className="mb-ticket-name"
                          value={t.badge}
                          onChange={(e) => updateTicket(ti, { badge: e.target.value })}
                          placeholder="Badge: Standard / Beliebt / VIP / Für Teams"
                        />
                        <label className="mb-ticket-featured">
                          <input
                            type="checkbox"
                            checked={t.featured}
                            onChange={(e) => updateTicket(ti, { featured: e.target.checked })}
                          />
                          <span>Lila-Highlight (VIP)</span>
                        </label>
                      </div>

                      <div className="mb-ticket-perks">
                        <div className="mb-ticket-perks-head">
                          <span className="mb-admin-eyebrow">Inhalte</span>
                          <button type="button" className="mb-admin-action mb-admin-action--add" onClick={() => addPerk(ti)}>
                            + Inhalt
                          </button>
                        </div>
                        {t.perks.length === 0 ? (
                          <div className="mb-admin-empty-row">Noch keine Inhalte. Füg z.&nbsp;B. „Zugang zu Keynotes" hinzu.</div>
                        ) : (
                          <div className="mb-timeline-list">
                            {t.perks.map((perk, pi) => (
                              <div key={pi} className="mb-perk-row">
                                <input
                                  type="text"
                                  className="mb-timeline-label"
                                  value={perk}
                                  onChange={(e) => updatePerk(ti, pi, e.target.value)}
                                  placeholder="z. B. Mehrgang-Dinner & Getränke"
                                />
                                <button
                                  type="button"
                                  className="mb-timeline-remove"
                                  onClick={() => removePerk(ti, pi)}
                                  title="Entfernen"
                                  aria-label="Inhalt entfernen"
                                >×</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  <th>Max</th>
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
                      <td>{e.max_attendees ?? "—"}</td>
                      <td>
                        <div className="mb-admin-actions">
                          <button
                            type="button"
                            className="mb-admin-action mb-admin-action--primary"
                            onClick={() => setMailEvent(e)}
                            disabled={editingId !== null}
                            title="Anmeldungs-Mail an Mitglieder schicken"
                          >
                            Mailen …
                          </button>
                          <button
                            type="button"
                            className="mb-admin-action"
                            onClick={() => setRegsEvent(e)}
                            disabled={editingId !== null}
                            title="Angemeldete Mitglieder ansehen"
                          >
                            Anmeldungen
                          </button>
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

      {mailEvent && (
        <EventMailModal event={mailEvent} onClose={() => setMailEvent(null)} />
      )}
      {regsEvent && (
        <EventRegistrationsModal event={regsEvent} onClose={() => setRegsEvent(null)} />
      )}
    </div>
  );
}
