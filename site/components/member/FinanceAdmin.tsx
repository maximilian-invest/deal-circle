"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { getFinance, type FinanceEvent, type FinancePayer } from "./admin";

/* ---------- icons ---------- */
const I = ({ d, w = 18, s = 1.8 }: { d: string[]; w?: number; s?: number }) => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d.map((p, i) => <path key={i} d={p} />)}
  </svg>
);
const ic: Record<string, string[]> = {
  search:   ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M21 21l-4.3-4.3"],
  download: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"],
  chevron:  ["M6 9l6 6 6-6"],
  check:    ["M20 6 9 17l-5-5"],
};

const C_STD = "#B14CFF"; // violet — Standard
const C_VIP = "#FF9A5C"; // amber  — VIP (Highlight-Kategorie)

const MON = ["Jan", "Feb", "März", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const eur = (cents: number) => "€ " + Math.round(cents / 100).toLocaleString("de-DE");
const eurK = (cents: number) => {
  const n = cents / 100;
  return n >= 1000
    ? "€ " + (n / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 }) + "k"
    : "€ " + Math.round(n).toLocaleString("de-DE");
};
function dParts(iso: string): { d: number | string; m: string; y: number | string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { d: "—", m: "", y: "" };
  return { d: d.getDate(), m: MON[d.getMonth()], y: d.getFullYear() };
}
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const p = (x: number) => String(x).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

// Anzeige-Status: vergangene Events gelten als „abgeschlossen", sonst der echte
// Event-Status. Farbe/Label kommen aus den vorhandenen .adm-status-Varianten.
const STATUS_LABEL: Record<string, string> = {
  open: "Anmeldung offen", limited: "Limitiert", waitlist: "Warteliste", closed: "Abgeschlossen",
};
function statusFor(ev: FinanceEvent): { key: string; label: string } {
  const t = new Date(ev.starts_at).getTime();
  const past = !Number.isNaN(t) && t < Date.now();
  const key = past ? "closed" : ev.status;
  return { key, label: STATUS_LABEL[key] ?? "—" };
}

/* ---------- Umsatzverlauf: gestapelte Säulen (Standard + VIP), chronologisch ---------- */
function RevenueChart({ events }: { events: FinanceEvent[] }) {
  const chrono = [...events].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const max = Math.max(1, ...chrono.map((e) => e.revenue_cents));
  return (
    <div className="adm-chart" style={{ gridColumn: "1 / -1" }}>
      <div className="adm-chart-head">
        <div>
          <div className="adm-chart-title">Umsatzverlauf je Event</div>
          <div className="adm-chart-sub">Gestapelt nach Ticket-Typ · chronologisch</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <span className="adm-leg" style={{ alignItems: "center" }}><span className="adm-leg-dot" style={{ background: C_STD, marginTop: 0 }} /><span className="adm-leg-k">Standard</span></span>
          <span className="adm-leg" style={{ alignItems: "center" }}><span className="adm-leg-dot" style={{ background: C_VIP, marginTop: 0 }} /><span className="adm-leg-k">VIP</span></span>
        </div>
      </div>
      <div className="adm-cols">
        {chrono.map((e) => {
          const p = dParts(e.starts_at);
          const stdH = (e.std_rev_cents / max) * 100;
          const vipH = (e.vip_rev_cents / max) * 100;
          const h = stdH + vipH;
          const denom = h || 1;
          return (
            <div className="adm-col" key={e.id} title={`${e.title} · ${eur(e.revenue_cents)}`}>
              <div className="adm-col-val">{eurK(e.revenue_cents)}</div>
              <div className="adm-col-bar-wrap" style={{ height: h + "%" }}>
                {e.vip_rev_cents > 0 && <div className="adm-col-bar vipseg" style={{ height: (vipH / denom * 100) + "%" }} />}
                <div className="adm-col-bar" style={{ height: (stdH / denom * 100) + "%" }} />
              </div>
              <div className="adm-col-x"><div className="mx">{p.m}</div><div className="yx">{p.y}</div></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Ticket-Mix Donut (Umsatzanteil Standard vs. VIP) ---------- */
function MixDonut({ stdRevCents, vipRevCents }: { stdRevCents: number; vipRevCents: number }) {
  const realTotal = stdRevCents + vipRevCents;
  const total = realTotal || 1;
  const R = 70, C = 2 * Math.PI * R;
  const stdLen = (stdRevCents / total) * C;
  const Arc = ({ color, len, off }: { color: string; len: number; off: number }) => (
    <circle cx="84" cy="84" r={R} fill="none" stroke={color} strokeWidth="22"
      strokeDasharray={`${len} ${C - len}`} strokeDashoffset={off}
      style={{ transition: "stroke-dashoffset 700ms cubic-bezier(.22,1,.36,1)" }} />
  );
  const pct = (v: number) => Math.round((v / total) * 100);
  return (
    <div className="adm-chart">
      <div className="adm-chart-head">
        <div>
          <div className="adm-chart-title">Ticket-Mix</div>
          <div className="adm-chart-sub">Umsatzanteil nach Ticket-Typ</div>
        </div>
      </div>
      <div className="adm-donut-wrap">
        <div className="adm-donut">
          <svg width="168" height="168">
            <circle cx="84" cy="84" r={R} fill="none" stroke="var(--color-surface-2)" strokeWidth="22" />
            <Arc color={C_STD} len={stdLen} off={0} />
            <Arc color={C_VIP} len={C - stdLen} off={-stdLen} />
          </svg>
          <div className="adm-donut-center">
            <div className="v">{eurK(realTotal)}</div>
            <div className="k">Gesamt</div>
          </div>
        </div>
        <div className="adm-legend">
          <div className="adm-leg">
            <span className="adm-leg-dot" style={{ background: C_STD }} />
            <div><div className="adm-leg-k">Standard</div><div className="adm-leg-v"><b>{eur(stdRevCents)}</b> · {pct(stdRevCents)}%</div></div>
          </div>
          <div className="adm-leg">
            <span className="adm-leg-dot" style={{ background: C_VIP }} />
            <div><div className="adm-leg-k">VIP</div><div className="adm-leg-v"><b>{eur(vipRevCents)}</b> · {pct(vipRevCents)}%</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Karte je Event mit Teilnehmer-Ledger ---------- */
function EventCard({ ev, rows, open, onToggle, showAll, onToggleAll }: {
  ev: FinanceEvent; rows: FinancePayer[]; open: boolean; onToggle: () => void; showAll: boolean; onToggleAll: () => void;
}) {
  const p = dParts(ev.starts_at);
  const st = statusFor(ev);
  const shown = showAll ? rows : rows.slice(0, 8);
  const avg = ev.ticket_count ? ev.revenue_cents / ev.ticket_count : 0;
  return (
    <div className="adm-fin-ev">
      <div className="adm-fin-ev-top">
        <div className="adm-date"><div className="d">{p.d}</div><div className="m">{p.m}</div><div className="y">{p.y}</div></div>
        <div className="adm-fin-ev-main">
          <div className="adm-fin-ev-title">
            {ev.title}
            <span className="adm-status" data-s={st.key}><i />{st.label}</span>
          </div>
          <div className="adm-fin-ev-meta">
            <span>{ev.location}</span>
            <span className="dot" />
            <span><b>{ev.ticket_count}</b> Teilnehmer</span>
            <span className="dot" />
            <span>Ø <b>{eur(avg)}</b> / Gast</span>
          </div>
        </div>
        <div className="adm-fin-ev-rev">
          <div className="adm-fin-ev-rev-v">{eur(ev.revenue_cents)}</div>
          <div className="adm-fin-ev-rev-k">Umsatz</div>
        </div>
      </div>

      <div className="adm-fin-ev-foot">
        {ev.categories.map((c, i) => (
          <span className={`adm-chip${c.featured ? " adm-chip-vip" : ""}`} key={i}><b>{c.count}×</b> {c.name}</span>
        ))}
        <button className="adm-add" onClick={onToggle}>
          {open ? "Teilnehmer verbergen" : `Teilnehmer ansehen (${ev.ticket_count})`}
          <span className="adm-fin-caret" data-open={open ? "true" : "false"}><I d={ic.chevron} w={15} /></span>
        </button>
      </div>

      {open && (
        <div className="adm-pay">
          <div className="adm-pay-head">
            <span>Teilnehmer</span>
            <span className="tkcol">Ticket</span>
            <span className="amtcol r">Betrag</span>
            <span>Zahlart</span>
            <span className="datecol r">Bezahlt am</span>
          </div>
          {shown.map((pay, i) => (
            <div className="adm-pay-row" key={i}>
              <div className="adm-pay-name"><div className="n">{pay.name}</div>{pay.company && <div className="c">{pay.company}</div>}</div>
              <div className="adm-pay-tk" data-vip={pay.vip ? "true" : "false"}>{pay.ticket}</div>
              <div className="adm-pay-amt">{eur(pay.price_cents)}</div>
              <div className="adm-pay-method">{pay.method}</div>
              <div className="adm-pay-date">{fmtDate(pay.paid_at)}</div>
            </div>
          ))}
          {rows.length === 0 && <div className="adm-pay-empty">Kein Teilnehmer passt zur Suche.</div>}
          {rows.length > 8 && (
            <button className="adm-add adm-add-block adm-pay-more" onClick={onToggleAll}>
              {showAll ? "Weniger anzeigen" : `Alle ${rows.length} anzeigen`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ===================== Finanzen / Einnahmen-Dashboard ===================== */
export default function FinanceAdmin() {
  const [data, setData] = useState<FinanceEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("all");
  const [q, setQ] = useState("");
  const [openMap, setOpenMap] = useState<Record<number, boolean>>({});
  const [allMap, setAllMap] = useState<Record<number, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    getFinance()
      .then((rows) => { if (!cancelled) setData(rows); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Daten nicht ladbar."); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const showToast = (m: string) => {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  const years = useMemo(() => {
    const set = new Set<string>();
    for (const e of data ?? []) {
      const y = new Date(e.starts_at).getFullYear();
      if (!Number.isNaN(y)) set.add(String(y));
    }
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [data]);

  const events = useMemo(() => {
    const all = data ?? [];
    return period === "all" ? all : all.filter((e) => String(new Date(e.starts_at).getFullYear()) === period);
  }, [data, period]);

  const totals = useMemo(() => {
    const sum = (f: (e: FinanceEvent) => number) => events.reduce((s, e) => s + f(e), 0);
    const totalRevenue = sum((e) => e.revenue_cents);
    const totalTickets = sum((e) => e.ticket_count);
    const stdRev = sum((e) => e.std_rev_cents);
    const vipRev = sum((e) => e.vip_rev_cents);
    const stdCount = sum((e) => e.std_count);
    const vipCount = sum((e) => e.vip_count);
    const avg = totalTickets ? totalRevenue / totalTickets : 0;
    const best = events.reduce<FinanceEvent | null>((b, e) => (!b || e.revenue_cents > b.revenue_cents ? e : b), null);
    return { totalRevenue, totalTickets, stdRev, vipRev, stdCount, vipCount, avg, best };
  }, [events]);

  const qq = q.trim().toLowerCase();
  const rowsFor = (ev: FinanceEvent) =>
    ev.payers.filter((p) => qq === "" || `${p.name} ${p.company ?? ""}`.toLowerCase().includes(qq));

  // CSV-Export des kompletten Teilnehmer-Ledgers (echte Zahlungen) im aktuellen Zeitraum.
  const exportCsv = () => {
    const head = ["Event", "Event-Datum", "Teilnehmer", "Firma", "Ticket", "Betrag (EUR)", "Zahlart", "Bezahlt am"];
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [head.map(esc).join(";")];
    for (const ev of events) {
      const evDate = fmtDate(ev.starts_at);
      for (const pay of ev.payers) {
        lines.push([
          ev.title, evDate, pay.name, pay.company ?? "", pay.ticket,
          (pay.price_cents / 100).toFixed(2).replace(".", ","), pay.method, fmtDate(pay.paid_at),
        ].map(esc).join(";"));
      }
    }
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dealcircle-einnahmen-${period}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("Export erstellt — CSV heruntergeladen.");
  };

  const Head = (
    <header className="adm-head">
      <div>
        <div className="adm-head-eyebrow">Admin · Finanzen</div>
        <h1 className="adm-head-title">Einnahmen.</h1>
        <p className="adm-head-sub">Umsatz je Event, Ticket-Mix und wer teilgenommen hat.</p>
      </div>
      <div className="adm-head-actions">
        <select className="adm-select" style={{ width: "auto", minWidth: 168 }} value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="all">Alle Zeiträume</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <button className="adm-btn adm-btn-secondary" onClick={exportCsv} disabled={events.length === 0}>
          <I d={ic.download} w={16} /> Export
        </button>
      </div>
    </header>
  );

  if (error) {
    return (
      <div className="adm"><div className="adm-wrap">
        {Head}
        <div className="mb-admin-alert mb-admin-alert--error" style={{ marginTop: 24 }}>{error}</div>
      </div></div>
    );
  }
  if (!data) {
    return (
      <div className="adm"><div className="adm-wrap">
        {Head}
        <div style={{ marginTop: 32, color: "var(--color-ink-muted)", font: "var(--type-body)" }}>Zahlen werden geladen …</div>
      </div></div>
    );
  }

  return (
    <div className="adm">
      <div className="adm-wrap">
        {Head}

        <div className="adm-fin-kpis">
          <div className="adm-fin-hero">
            <div className="adm-fin-hero-k">Gesamteinnahmen</div>
            <div className="adm-fin-hero-v">{eur(totals.totalRevenue)}</div>
            <div className="adm-fin-hero-sub">{totals.totalTickets} Teilnehmer · {period === "all" ? "alle Zeiträume" : period}</div>
          </div>
          <div className="adm-fin-stats">
            <div className="adm-fin-stat">
              <div className="adm-fin-stat-k">Tickets verkauft</div>
              <div className="adm-fin-stat-v">{totals.totalTickets}</div>
              <div className="adm-fin-stat-note">über <b>{events.length}</b> Event{events.length === 1 ? "" : "s"}</div>
            </div>
            <div className="adm-fin-stat">
              <div className="adm-fin-stat-k">Ø Umsatz / Gast</div>
              <div className="adm-fin-stat-v">{eur(totals.avg)}</div>
              <div className="adm-fin-stat-note">VIP-Umsatz <b>{eur(totals.vipRev)}</b></div>
            </div>
            <div className="adm-fin-stat">
              <div className="adm-fin-stat-k">Bestes Event</div>
              <div className="adm-fin-stat-v">{totals.best ? eurK(totals.best.revenue_cents) : "—"}</div>
              <div className="adm-fin-stat-note">{totals.best ? (totals.best.title.replace(/[.—].*$/, "").trim() || totals.best.title) : "—"}</div>
            </div>
          </div>
        </div>

        <div className="adm-fin-charts">
          <RevenueChart events={events} />
          <MixDonut stdRevCents={totals.stdRev} vipRevCents={totals.vipRev} />
          <div className="adm-chart">
            <div className="adm-chart-head">
              <div>
                <div className="adm-chart-title">Eckdaten</div>
                <div className="adm-chart-sub">{period === "all" ? "Alle Zeiträume" : period}</div>
              </div>
            </div>
            <div className="adm-facts">
              <div className="adm-fact"><span className="adm-fact-k">Events</span><span className="adm-fact-v">{events.length}</span></div>
              <div className="adm-fact"><span className="adm-fact-k">Standard-Tickets</span><span className="adm-fact-v">{totals.stdCount}</span></div>
              <div className="adm-fact"><span className="adm-fact-k">VIP-Tickets</span><span className="adm-fact-v">{totals.vipCount}</span></div>
              <div className="adm-fact"><span className="adm-fact-k">VIP-Anteil Umsatz</span><span className="adm-fact-v">{Math.round((totals.vipRev / (totals.totalRevenue || 1)) * 100)}%</span></div>
            </div>
          </div>
        </div>

        <div className="adm-fin-controls">
          <div className="adm-fin-sec-label" style={{ margin: 0 }}>Umsatz je Event</div>
          <div className="adm-search">
            <I d={ic.search} w={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nach Name oder Firma suchen …" />
          </div>
        </div>

        <div className="adm-fin-events">
          {events.map((ev) => {
            const rows = rowsFor(ev);
            const isOpen = !!openMap[ev.id] || (qq !== "" && rows.length > 0);
            return (
              <EventCard key={ev.id} ev={ev} rows={rows} open={isOpen}
                onToggle={() => setOpenMap((m) => ({ ...m, [ev.id]: !m[ev.id] }))}
                showAll={!!allMap[ev.id]}
                onToggleAll={() => setAllMap((m) => ({ ...m, [ev.id]: !m[ev.id] }))} />
            );
          })}
          {events.length === 0 && (
            <div className="adm-empty">
              <div className="adm-empty-t">{data.length === 0 ? "Noch keine Einnahmen." : "Keine Events im Zeitraum."}</div>
              <div className="adm-empty-d">
                {data.length === 0
                  ? "Sobald die erste Zahlung eingeht, erscheinen hier Umsatz, Ticket-Mix und Teilnehmer."
                  : "Wähle einen anderen Zeitraum, um Einnahmen zu sehen."}
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && <div className="adm-toast"><I d={ic.check} w={16} s={2.4} />{toast}</div>}
    </div>
  );
}
