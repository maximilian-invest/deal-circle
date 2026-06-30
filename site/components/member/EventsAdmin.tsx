"use client";
import { useEffect, useRef, useState } from "react";
import {
  createEvent,
  deleteEvent,
  listEvents,
  updateEvent,
  uploadImage,
  type CreateEventInput,
} from "./events";
import type { EventDto, EventStatusApi } from "./types";
import EventMailModal from "./EventMailModal";
import EventRegistrationsModal from "./EventRegistrationsModal";

/* ---------- icons ---------- */
const I = ({ d, w = 18, s = 1.8 }: { d: string[]; w?: number; s?: number }) => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d.map((p, i) => <path key={i} d={p} />)}
  </svg>
);
const ic: Record<string, string[]> = {
  plus:    ["M12 5v14", "M5 12h14"],
  refresh: ["M21 12a9 9 0 1 1-3-6.7L21 7", "M21 3v4h-4"],
  search:  ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M21 21l-4.3-4.3"],
  back:    ["M19 12H5", "M12 19l-7-7 7-7"],
  dots:    ["M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z", "M19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z", "M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"],
  eye:     ["M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
  mail:    ["M4 4h16v16H4z", "M4 6l8 6 8-6"],
  users:   ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M22 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
  edit:    ["M12 20h9", "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"],
  copy:    ["M9 9h11v11H9z", "M5 15H4V4h11v1"],
  trash:   ["M3 6h18", "M8 6V4h8v2", "M19 6l-1 14H6L5 6", "M10 11v6", "M14 11v6"],
  image:   ["M3 5h18v14H3z", "M3 16l5-5 4 4 3-3 6 6", "M9 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"],
  check:   ["M20 6 9 17l-5-5"],
};

const STATUS_LABELS: Record<EventStatusApi, string> = {
  open:     "Anmeldung offen",
  limited:  "Limitiert",
  waitlist: "Warteliste",
  closed:   "Abgeschlossen",
};
const STATUS_KEYS: EventStatusApi[] = ["open", "limited", "waitlist", "closed"];
const MONTHS = ["Jan", "Feb", "März", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
function pad(n: number) { return String(n).padStart(2, "0"); }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function dateParts(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { d: "—", m: "", y: "" };
  return { d: d.getDate(), m: MONTHS[d.getMonth()], y: d.getFullYear() };
}
function hhmm(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ---------- editor form shape + mappers ---------- */
type EvProgram = { id?: number; t: string; v: string };
type EvSpeaker = { id?: number; name: string; bio: string; photo_path: string | null };
type EvTicket = { id?: number; name: string; price: string; vip: boolean; incl: string[]; badge: string | null };
type EvForm = {
  id?: number;
  title: string;
  date: string;
  time: string;
  location: string;
  status: EventStatusApi;
  fee: string;
  max: string;
  visibility: "public" | "members";
  featured: boolean;
  member_discount_pct: string;
  description: string;
  cover_path: string | null;
  program: EvProgram[];
  speakers: EvSpeaker[];
  tickets: EvTicket[];
};

function toForm(e: EventDto): EvForm {
  const d = new Date(e.starts_at);
  return {
    id: e.id,
    title: e.title,
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    location: e.location,
    status: e.status,
    fee: String(Math.round(e.fee_cents / 100)),
    max: e.max_attendees == null ? "" : String(e.max_attendees),
    visibility: e.visibility,
    featured: e.is_main,
    member_discount_pct: String(e.member_discount_pct ?? 0),
    description: e.description ?? "",
    cover_path: e.cover_path,
    program: e.timeline.map((t) => ({ id: t.id, t: t.time_label, v: t.label })),
    speakers: e.speakers.map((s) => ({ id: s.id, name: s.name, bio: s.bio ?? "", photo_path: s.photo_path })),
    tickets: (e.tickets ?? []).map((t) => ({
      id: t.id, name: t.name, price: String(Math.round(t.price_cents / 100)),
      vip: !!t.featured, incl: [...t.perks], badge: t.badge ?? null,
    })),
  };
}

function blankForm(): EvForm {
  return {
    title: "", date: "", time: "18:30", location: "Schloss Wiespach, Hallein",
    status: "open", fee: "380", max: "60", visibility: "members", featured: false,
    member_discount_pct: "0", description: "", cover_path: null,
    program: [{ t: "18:30", v: "" }], speakers: [],
    tickets: [{ name: "Standard", price: "380", vip: false, incl: ["Zugang zu allen Keynotes"], badge: null }],
  };
}

function fromForm(f: EvForm): CreateEventInput {
  const iso = new Date(`${f.date}T${(f.time || "00:00")}:00`).toISOString();
  const tickets = f.tickets.filter((t) => t.name.trim()).map((t) => ({
    name: t.name.trim(), badge: t.badge, featured: t.vip,
    price_cents: Math.round(Number(t.price || "0") * 100),
    perks: t.incl.map((p) => p.trim()).filter(Boolean),
  }));
  // Der Basis-Beitrag ergibt sich aus den Ticketpreisen (günstigste Kategorie) —
  // kein eigenes Feld mehr. fee_cents dient nur noch als Fallback ohne Tickets
  // und als "ab"-Preis in der Übersicht.
  const ticketCents = tickets.map((t) => t.price_cents).filter((c) => c > 0);
  return {
    title: f.title.trim(),
    starts_at: iso,
    location: f.location.trim(),
    status: f.status,
    is_main: f.featured,
    visibility: f.visibility,
    member_discount_pct: clamp(Math.round(Number(f.member_discount_pct || "0")), 0, 90),
    fee_cents: ticketCents.length ? Math.min(...ticketCents) : 0,
    max_attendees: f.max.trim() === "" ? null : Number(f.max),
    description: f.description.trim() ? f.description.trim() : null,
    cover_path: f.cover_path,
    timeline: f.program.filter((p) => p.t.trim() && p.v.trim()).map((p) => ({ time_label: p.t.trim(), label: p.v.trim() })),
    speakers: f.speakers.filter((s) => s.name.trim()).map((s) => ({ name: s.name.trim(), bio: s.bio.trim() ? s.bio.trim() : null, photo_path: s.photo_path })),
    tickets,
  };
}

/* ---------- image dropzone (functional upload) ---------- */
function AdmDrop({ kind, photo, onUpload, onRemove, small, title, sub }: {
  kind: "speaker" | "cover";
  photo: string | null;
  onUpload: (p: string) => void;
  onRemove: () => void;
  small?: boolean;
  title?: string;
  sub?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      const path = await uploadImage(kind, file);
      onUpload(path);
    } catch (uploadErr) {
      setErr(uploadErr instanceof Error ? uploadErr.message : "Upload fehlgeschlagen");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const cls = `adm-drop${small ? " adm-drop-sm" : ""}`;
  if (photo) {
    return (
      <div className={`${cls} adm-drop-filled`} style={{ backgroundImage: `url(${photo})` }}>
        <button type="button" className="adm-drop-remove" onClick={onRemove} aria-label="Bild entfernen">✕</button>
      </div>
    );
  }
  return (
    <>
      <button type="button" className={cls} onClick={() => inputRef.current?.click()} disabled={busy}>
        <I d={ic.image} w={small ? 20 : 26} s={1.6} />
        {!small && <span className="adm-drop-t">{busy ? "Lädt …" : (err ? "Upload fehlgeschlagen" : (title || "Titelbild wählen"))}</span>}
        <span className="adm-drop-d" style={!busy && err ? { color: "#ff6b6b", whiteSpace: "normal" } : undefined}>
          {busy ? "…" : (err || (small ? "Foto" : (sub || "16:9 · JPG/PNG · max. 8 MB")))}
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} style={{ display: "none" }} />
    </>
  );
}

/* ===================== ROW MENU ===================== */
function RowMenu({ onView, onMail, onReg, onDup, onDelete }: {
  onView: () => void; onMail: () => void; onReg: () => void; onDup: () => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const Item = ({ icon, label, onClick, danger }: { icon: string; label: string; onClick: () => void; danger?: boolean }) => (
    <button className="adm-menu-item" data-danger={danger ? "true" : "false"} onClick={() => { setOpen(false); onClick(); }}>
      <I d={ic[icon]} w={16} /><span>{label}</span>
    </button>
  );
  return (
    <div className="adm-menu-anchor" ref={ref}>
      <button className="adm-btn-icon" aria-label="Weitere Aktionen" onClick={() => setOpen((v) => !v)}>
        <I d={ic.dots} w={18} />
      </button>
      {open && (
        <div className="adm-menu">
          <Item icon="users" label="Anmeldungen" onClick={onReg} />
          <Item icon="mail" label="Teilnehmer mailen" onClick={onMail} />
          <Item icon="eye" label="Öffentliche Seite" onClick={onView} />
          <Item icon="copy" label="Duplizieren" onClick={onDup} />
          <div className="adm-menu-sep" />
          <Item icon="trash" label="Event löschen" onClick={onDelete} danger />
        </div>
      )}
    </div>
  );
}

/* ===================== LIST ROW ===================== */
function EventRow({ ev, onEdit, onView, onMail, onReg, onDup, onDelete }: {
  ev: EventDto; onEdit: () => void; onView: () => void; onMail: () => void;
  onReg: () => void; onDup: () => void; onDelete: () => void;
}) {
  const p = dateParts(ev.starts_at);
  const fee = Math.round(ev.fee_cents / 100);
  const max = ev.max_attendees ?? 0;
  const registered = ev.registered ?? 0;
  const pct = max ? clamp(Math.round((registered / max) * 100), 0, 100) : 0;
  return (
    <div className="adm-row">
      <div className="adm-date">
        <div className="d">{p.d}</div>
        <div className="m">{p.m}</div>
        <div className="y">{p.y}</div>
      </div>
      <div className="adm-row-main">
        <div className="adm-row-title">{ev.title || "Unbenanntes Event"}</div>
        <div className="adm-row-meta">
          <span>{hhmm(ev.starts_at)} Uhr</span>
          <span className="dot" />
          <span>{ev.location}</span>
          <span className="dot" />
          <span>ab <b>€ {fee}</b></span>
          {ev.visibility === "members" && <><span className="dot" /><span>Nur Mitglieder</span></>}
          {max > 0 && (
            <>
              <span className="dot" />
              <span className="adm-att" title={`${registered} von ${max} angemeldet`}>
                <span className="adm-att-track"><span className="adm-att-fill" style={{ width: pct + "%" }} /></span>
                <span><b>{registered}</b> / {max}</span>
              </span>
            </>
          )}
        </div>
      </div>
      <div className="adm-row-actions">
        <span className="adm-status" data-s={ev.status}><i />{STATUS_LABELS[ev.status]}</span>
        <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={onEdit}>
          <I d={ic.edit} w={15} /> Bearbeiten
        </button>
        <RowMenu onView={onView} onMail={onMail} onReg={onReg} onDup={onDup} onDelete={onDelete} />
      </div>
    </div>
  );
}

/* ===================== EDITOR ===================== */
function Field({ label, hint, children }: { label: React.ReactNode; hint?: string; children: React.ReactNode }) {
  return (
    <label className="adm-field">
      <span className="adm-label">{label}</span>
      {children}
      {hint && <span className="adm-fs-hint">{hint}</span>}
    </label>
  );
}

function Editor({ initial, isNew, onCancel, onSave }: {
  initial: EvForm; isNew: boolean; onCancel: () => void; onSave: (f: EvForm) => Promise<void>;
}) {
  const [ev, setEv] = useState<EvForm>(initial);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof EvForm>(k: K, v: EvForm[K]) => setEv((s) => ({ ...s, [k]: v }));

  const setProg = (i: number, k: keyof EvProgram, v: string) => setEv((s) => { const program = s.program.slice(); program[i] = { ...program[i], [k]: v }; return { ...s, program }; });
  const addProg = () => setEv((s) => ({ ...s, program: [...s.program, { t: "", v: "" }] }));
  const delProg = (i: number) => setEv((s) => ({ ...s, program: s.program.filter((_, x) => x !== i) }));

  const setSpk = (i: number, k: keyof EvSpeaker, v: string) => setEv((s) => { const speakers = s.speakers.slice(); speakers[i] = { ...speakers[i], [k]: v }; return { ...s, speakers }; });
  const setSpkPhoto = (i: number, v: string | null) => setEv((s) => { const speakers = s.speakers.slice(); speakers[i] = { ...speakers[i], photo_path: v }; return { ...s, speakers }; });
  const addSpk = () => setEv((s) => ({ ...s, speakers: [...s.speakers, { name: "", bio: "", photo_path: null }] }));
  const delSpk = (i: number) => setEv((s) => ({ ...s, speakers: s.speakers.filter((_, x) => x !== i) }));

  const setTick = (i: number, k: keyof EvTicket, v: EvTicket[keyof EvTicket]) => setEv((s) => { const tickets = s.tickets.slice(); tickets[i] = { ...tickets[i], [k]: v }; return { ...s, tickets }; });
  const addTick = () => setEv((s) => ({ ...s, tickets: [...s.tickets, { name: "", price: "0", vip: false, incl: [], badge: null }] }));
  const delTick = (i: number) => setEv((s) => ({ ...s, tickets: s.tickets.filter((_, x) => x !== i) }));
  const setIncl = (ti: number, ii: number, v: string) => setEv((s) => { const tickets = s.tickets.slice(); const incl = tickets[ti].incl.slice(); incl[ii] = v; tickets[ti] = { ...tickets[ti], incl }; return { ...s, tickets }; });
  const addIncl = (ti: number) => setEv((s) => { const tickets = s.tickets.slice(); tickets[ti] = { ...tickets[ti], incl: [...tickets[ti].incl, ""] }; return { ...s, tickets }; });
  const delIncl = (ti: number, ii: number) => setEv((s) => { const tickets = s.tickets.slice(); tickets[ti] = { ...tickets[ti], incl: tickets[ti].incl.filter((_, x) => x !== ii) }; return { ...s, tickets }; });

  const save = async () => { setBusy(true); try { await onSave(ev); } finally { setBusy(false); } };

  return (
    <>
      <div className="adm-editor-bar">
        <div className="adm-editor-bar-in">
          <div className="adm-editor-bar-left">
            <button className="adm-back" onClick={onCancel} aria-label="Zurück"><I d={ic.back} w={18} /></button>
            <div style={{ minWidth: 0 }}>
              <div className="adm-editor-bar-eyebrow">{isNew ? "Neues Event" : "Event bearbeiten"}</div>
              <div className="adm-editor-bar-title">{ev.title || "Unbenanntes Event"}</div>
            </div>
          </div>
          <div className="adm-editor-bar-actions">
            <button className="adm-btn adm-btn-ghost" onClick={onCancel}>Abbrechen</button>
            <button className="adm-btn adm-btn-primary" onClick={save} disabled={busy}>
              <I d={ic.check} w={16} /> {busy ? "Speichert …" : (isNew ? "Event anlegen" : "Speichern")}
            </button>
          </div>
        </div>
      </div>

      <div className="adm-editor">
        {/* MAIN */}
        <div className="adm-editor-main">
          <div className="adm-fs">
            <Field label="Titel">
              <input className="adm-input adm-input-lg" value={ev.title} placeholder="z. B. Immo Intense — 2026" onChange={(e) => set("title", e.target.value)} />
            </Field>
            <div style={{ marginTop: 16 }}>
              <Field label="Beschreibung" hint="Erscheint als Intro auf der öffentlichen Event-Seite.">
                <textarea className="adm-textarea" value={ev.description} placeholder="Worum geht es an diesem Abend?" onChange={(e) => set("description", e.target.value)} />
              </Field>
            </div>
          </div>

          {/* program */}
          <div className="adm-fs">
            <div className="adm-fs-head">
              <div>
                <div className="adm-fs-title">Programm</div>
                <div className="adm-fs-hint">Ablauf des Abends, chronologisch.</div>
              </div>
              <button className="adm-add" onClick={addProg}><I d={ic.plus} w={15} /> Punkt</button>
            </div>
            <div className="adm-rep">
              {ev.program.map((row, i) => (
                <div className="adm-prog-row" key={i}>
                  <input className="adm-input" value={row.t} placeholder="18:30" onChange={(e) => setProg(i, "t", e.target.value)} />
                  <input className="adm-input" value={row.v} placeholder="Programmpunkt" onChange={(e) => setProg(i, "v", e.target.value)} />
                  <button className="adm-x" onClick={() => delProg(i)} aria-label="Entfernen"><I d={ic.trash} w={15} s={1.7} /></button>
                </div>
              ))}
              {ev.program.length === 0 && <button className="adm-add adm-add-block" onClick={addProg}><I d={ic.plus} w={15} /> Ersten Programmpunkt hinzufügen</button>}
            </div>
          </div>

          {/* speakers */}
          <div className="adm-fs">
            <div className="adm-fs-head">
              <div>
                <div className="adm-fs-title">Vortragende</div>
                <div className="adm-fs-hint">Name, kurze Beschreibung und Foto.</div>
              </div>
              <button className="adm-add" onClick={addSpk}><I d={ic.plus} w={15} /> Vortragende:n</button>
            </div>
            <div className="adm-rep">
              {ev.speakers.map((sp, i) => (
                <div className="adm-spk" key={i}>
                  <AdmDrop kind="speaker" small photo={sp.photo_path} onUpload={(p) => setSpkPhoto(i, p)} onRemove={() => setSpkPhoto(i, null)} />
                  <div className="adm-spk-fields">
                    <input className="adm-input" value={sp.name} placeholder="Name" onChange={(e) => setSpk(i, "name", e.target.value)} />
                    <input className="adm-input" value={sp.bio} placeholder="Kurzbeschreibung (z. B. „Investmentpunk“)" onChange={(e) => setSpk(i, "bio", e.target.value)} />
                  </div>
                  <button className="adm-x" onClick={() => delSpk(i)} aria-label="Entfernen"><I d={ic.trash} w={15} s={1.7} /></button>
                </div>
              ))}
              {ev.speakers.length === 0 && <button className="adm-add adm-add-block" onClick={addSpk}><I d={ic.plus} w={15} /> Vortragende:n hinzufügen</button>}
            </div>
          </div>

          {/* tickets */}
          <div className="adm-fs">
            <div className="adm-fs-head">
              <div>
                <div className="adm-fs-title">Tickets &amp; Preise</div>
                <div className="adm-fs-hint">Eine Karte je Variante. Markiere eine als VIP-Highlight. Alle Preise <b>netto</b> eingeben — exkl. MwSt. (Stripe weist die MwSt. automatisch aus).</div>
              </div>
              <button className="adm-add" onClick={addTick}><I d={ic.plus} w={15} /> Variante</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Field label="Mitglieder-Rabatt auf alle Tickets (%)" hint="Gilt für alle Ticket-Preise. 0 = kein Rabatt. Eingeloggte Mitglieder zahlen weniger; Gäste den regulären Preis.">
                <input className="adm-input" type="number" min={0} max={90} value={ev.member_discount_pct} onChange={(e) => set("member_discount_pct", e.target.value)} style={{ maxWidth: 180 }} />
              </Field>
            </div>

            <div className="adm-rep" style={{ gap: 14 }}>
              {ev.tickets.map((tk, ti) => (
                <div className="adm-tick" data-vip={tk.vip ? "true" : "false"} key={ti}>
                  <div className="adm-tick-top">
                    <input className="adm-input" value={tk.name} placeholder="Bezeichnung (z. B. Standard)" onChange={(e) => setTick(ti, "name", e.target.value)} />
                    <div className="adm-money">
                      <input className="adm-input" type="number" value={tk.price} onChange={(e) => setTick(ti, "price", e.target.value)} />
                    </div>
                    <button className="adm-x" onClick={() => delTick(ti)} aria-label="Variante entfernen"><I d={ic.trash} w={15} s={1.7} /></button>
                  </div>
                  <div className="adm-tick-vip" onClick={() => setTick(ti, "vip", !tk.vip)}>
                    <span className="adm-check" data-on={tk.vip ? "true" : "false"}><I d={ic.check} w={13} s={2.6} /></span>
                    Als VIP-Highlight (lila) hervorheben
                  </div>
                  <div className="adm-tick-incl">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span className="adm-tick-incl-label">Enthaltene Leistungen</span>
                      <button className="adm-add" style={{ padding: "6px 11px", fontSize: 12 }} onClick={() => addIncl(ti)}><I d={ic.plus} w={13} /> Inhalt</button>
                    </div>
                    {tk.incl.map((line, ii) => (
                      <div className="adm-incl-row" key={ii}>
                        <span className="adm-incl-check"><I d={ic.check} w={16} s={2.4} /></span>
                        <input className="adm-input" value={line} placeholder="Leistung" onChange={(e) => setIncl(ti, ii, e.target.value)} />
                        <button className="adm-x" onClick={() => delIncl(ti, ii)} aria-label="Entfernen"><I d={ic.trash} w={14} s={1.7} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ASIDE */}
        <aside className="adm-editor-aside">
          <div className="adm-fs">
            <div className="adm-fs-head"><div className="adm-fs-title">Eckdaten</div></div>
            <div className="adm-grid2">
              <Field label="Datum"><input className="adm-input" type="date" value={ev.date} onChange={(e) => set("date", e.target.value)} /></Field>
              <Field label="Beginn"><input className="adm-input" type="time" value={ev.time} onChange={(e) => set("time", e.target.value)} /></Field>
            </div>
            <Field label="Ort"><input className="adm-input" value={ev.location} placeholder="Location, Stadt" onChange={(e) => set("location", e.target.value)} /></Field>
            <Field label="Status">
              <select className="adm-select" value={ev.status} onChange={(e) => set("status", e.target.value as EventStatusApi)}>
                {STATUS_KEYS.map((k) => <option key={k} value={k}>{STATUS_LABELS[k]}</option>)}
              </select>
            </Field>
            <div style={{ marginTop: 16 }}>
              <Field label={<span>Max. <small>Teilnehmer</small></span>}><input className="adm-input" type="number" value={ev.max} onChange={(e) => set("max", e.target.value)} style={{ maxWidth: 180 }} /></Field>
            </div>
          </div>

          <div className="adm-fs">
            <div className="adm-fs-head"><div className="adm-fs-title">Sichtbarkeit</div></div>
            <Field label="Wer sieht das Event">
              <select className="adm-select" value={ev.visibility} onChange={(e) => set("visibility", e.target.value as "public" | "members")}>
                <option value="public">Öffentlich — für alle sichtbar</option>
                <option value="members">Nur Mitglieder</option>
              </select>
            </Field>
            <div style={{ marginTop: 14 }} className="adm-toggle-row" onClick={() => set("featured", !ev.featured)}>
              <span className="adm-toggle" data-on={ev.featured ? "true" : "false"} />
              <span className="adm-toggle-text">
                <span className="t">Als Main-Event auf der Startseite</span>
                <span className="d">Prominent im Hero der öffentlichen Seite anzeigen.</span>
              </span>
            </div>
          </div>

          <div className="adm-fs">
            <div className="adm-fs-head"><div className="adm-fs-title">Titelbild</div></div>
            <AdmDrop kind="cover" photo={ev.cover_path} onUpload={(p) => set("cover_path", p)} onRemove={() => set("cover_path", null)} />
          </div>
        </aside>
      </div>
    </>
  );
}

/* ===================== APP ===================== */
export default function EventsAdmin() {
  const [events, setEvents] = useState<EventDto[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ form: EvForm; isNew: boolean } | null>(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [mailEvent, setMailEvent] = useState<EventDto | null>(null);
  const [regsEvent, setRegsEvent] = useState<EventDto | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  const reload = async () => {
    try {
      setLoadError(null);
      setEvents(await listEvents());
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Events konnten nicht geladen werden.");
    }
  };
  useEffect(() => { reload(); }, []);

  const onSave = async (f: EvForm) => {
    if (!f.title.trim() || !f.date || !f.time || !f.location.trim()) {
      showToast("Titel, Datum, Uhrzeit und Ort sind Pflichtfelder.");
      return;
    }
    let input: CreateEventInput;
    try { input = fromForm(f); } catch { showToast("Bitte Datum/Uhrzeit prüfen."); return; }
    try {
      if (f.id != null) await updateEvent(f.id, input);
      else await createEvent(input);
      await reload();
      setEditing(null);
      showToast(f.id != null ? "Änderungen gespeichert" : "Event angelegt");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
    }
  };

  const onDelete = async (ev: EventDto) => {
    if (!confirm(`„${ev.title || "Event"}" wirklich löschen?`)) return;
    try { await deleteEvent(ev.id); await reload(); showToast("Event gelöscht"); }
    catch (e) { showToast(e instanceof Error ? e.message : "Löschen fehlgeschlagen."); }
  };

  const onDup = async (ev: EventDto) => {
    try {
      const input = fromForm({ ...toForm(ev), id: undefined, title: `${ev.title} (Kopie)`, status: "open", featured: false });
      await createEvent(input);
      await reload();
      showToast("Event dupliziert");
    } catch (e) { showToast(e instanceof Error ? e.message : "Duplizieren fehlgeschlagen."); }
  };

  /* ---------- EDITOR VIEW ---------- */
  if (editing) {
    return (
      <div className="adm">
        <Editor initial={editing.form} isNew={editing.isNew} onCancel={() => setEditing(null)} onSave={onSave} />
        {toast && <div className="adm-toast"><I d={ic.check} w={16} s={2.4} />{toast}</div>}
      </div>
    );
  }

  /* ---------- LIST VIEW ---------- */
  const list = events ?? [];
  const sorted = [...list].sort((a, b) => (a.starts_at < b.starts_at ? 1 : -1));
  const filtered = sorted.filter((e) => `${e.title} ${e.location}`.toLowerCase().includes(query.toLowerCase()));
  const totalReg = list.reduce((s, e) => s + (e.registered ?? 0), 0);
  const upcoming = list.filter((e) => e.status !== "closed").length;

  return (
    <div className="adm">
      <div className="adm-wrap">
        <header className="adm-head">
          <div>
            <div className="adm-head-eyebrow">Admin · Events</div>
            <h1 className="adm-head-title">Events verwalten.</h1>
            <p className="adm-head-sub">Anlegen, bearbeiten, Teilnehmer im Blick behalten.</p>
          </div>
          <div className="adm-head-actions">
            <div className="adm-search">
              <I d={ic.search} w={16} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Events durchsuchen …" />
            </div>
            <button className="adm-btn adm-btn-secondary" onClick={() => { reload(); showToast("Aktualisiert"); }} aria-label="Aktualisieren"><I d={ic.refresh} w={16} /></button>
            <button className="adm-btn adm-btn-primary" onClick={() => setEditing({ form: blankForm(), isNew: true })}>
              <I d={ic.plus} w={16} /> Neues Event
            </button>
          </div>
        </header>

        <div className="adm-summary">
          <div className="adm-sum"><div className="adm-sum-v">{list.length}</div><div className="adm-sum-k">Events gesamt</div></div>
          <div className="adm-sum"><div className="adm-sum-v">{upcoming}</div><div className="adm-sum-k">Anstehend</div></div>
          <div className="adm-sum"><div className="adm-sum-v">{totalReg}</div><div className="adm-sum-k">Anmeldungen gesamt</div></div>
        </div>

        {loadError && <div className="mb-admin-alert mb-admin-alert--error" style={{ marginTop: 24 }}>{loadError}</div>}

        {events === null && !loadError && (
          <div className="adm-empty"><div className="adm-empty-t">Wird geladen …</div></div>
        )}

        {events !== null && (
          <div className="adm-list">
            <div className="adm-list-label">{filtered.length} {filtered.length === 1 ? "Event" : "Events"}</div>
            {filtered.map((ev) => (
              <EventRow
                key={ev.id}
                ev={ev}
                onEdit={() => setEditing({ form: toForm(ev), isNew: false })}
                onView={() => window.open(`/event/?id=${ev.id}`, "_blank", "noopener")}
                onMail={() => setMailEvent(ev)}
                onReg={() => setRegsEvent(ev)}
                onDup={() => onDup(ev)}
                onDelete={() => onDelete(ev)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="adm-empty">
                <div className="adm-empty-t">Keine Events gefunden.</div>
                <div className="adm-empty-d">Passe deine Suche an oder lege ein neues Event an.</div>
                <button className="adm-btn adm-btn-primary" onClick={() => setEditing({ form: blankForm(), isNew: true })}><I d={ic.plus} w={16} /> Neues Event</button>
              </div>
            )}
          </div>
        )}
      </div>

      {mailEvent && (
        <EventMailModal event={mailEvent} onClose={() => setMailEvent(null)} onSent={(msg) => { setMailEvent(null); showToast(msg); }} />
      )}
      {regsEvent && (
        <EventRegistrationsModal event={regsEvent} onClose={() => setRegsEvent(null)} />
      )}

      {toast && <div className="adm-toast"><I d={ic.check} w={16} s={2.4} />{toast}</div>}
    </div>
  );
}
