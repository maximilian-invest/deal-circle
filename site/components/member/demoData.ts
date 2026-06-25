import type {
  Album, NextEventData, PastEventItem, StatItem, UpcomingEvent,
} from "./types";

const fmtDate = (d: Date) =>
  d.toLocaleDateString("de-AT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export function buildDemoData() {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 33);
  nextDate.setHours(18, 30, 0, 0);

  const nextEvent: NextEventData = {
    id: 0,
    iso: nextDate.toISOString(),
    title: "Wiespach LXVII · Privatkapital im Mittelstand.",
    dateLabel: fmtDate(nextDate) + " · 18:30",
    location: "Schloss Wiespach, Hallein",
    attendees: 32,
    userStatus: "open",
  };

  const upcoming: UpcomingEvent[] = [
    {
      id: "e1",
      day: nextDate.getDate(),
      month: nextDate.toLocaleDateString("de-AT", { month: "short" }).replace(".", ""),
      monthLong: nextDate.toLocaleDateString("de-AT", { month: "long" }),
      title: "Wiespach LXVII · Privatkapital im Mittelstand.",
      time: "18:30 – 22:30",
      location: "Schloss Wiespach",
      status: "open",
      fee: 380,
    },
    {
      id: "e2", day: 18, month: "Apr", monthLong: "April",
      title: "Frühjahrsevent · Familienunternehmen & Nachfolge.",
      time: "Ganztägig",   location: "Schloss Wiespach",
      status: "limited",   fee: 980,
    },
    {
      id: "e3", day: 12, month: "Jun", monthLong: "Juni",
      title: "Wiespach LXVIII · Energie & Infrastruktur.",
      time: "18:30 – 22:30", location: "Schloss Wiespach",
      status: "open",        fee: 380,
    },
    {
      id: "e4", day: 22, month: "Aug", monthLong: "August",
      title: "Sommerevent · Drei Tage am See.",
      time: "Mehrtägig", location: "St. Wolfgang",
      status: "waitlist", fee: 1480,
    },
  ];

  const stats: StatItem[] = [
    { label: "Treffen besucht",   value: "14",   note: "seit Aufnahme 2024" },
    { label: "Nächste Anmeldung", value: "33 T", note: "Wiespach LXVII" },
    { label: "Offene Beiträge",   value: "€ 0",  note: "alle Zahlungen aktuell" },
  ];

  const albums: Album[] = [
    { title: "Wiespach LXVI · Bauwirtschaft im Umbruch.",  meta: "12. Dezember 2025", count: 38,  tone: "violet" },
    { title: "Jahresabschluss 2025",                        meta: "5. Dezember 2025",  count: 64,  tone: "magenta" },
    { title: "Wiespach LXV · KI im Mittelstand.",          meta: "10. Oktober 2025",  count: 41,  tone: "orange" },
    { title: "Sommerevent 2025 · Drei Tage am See.",       meta: "23. August 2025",   count: 112, tone: "coral" },
    { title: "Wiespach LXIV · Energiewende & Kapital.",    meta: "18. Juni 2025",     count: 36,  tone: "dusk" },
  ];

  const past: PastEventItem[] = [
    { date: "12. Dez 2025", title: "Wiespach LXVI · Bauwirtschaft im Umbruch.", speaker: "Vortrag: Familienunternehmer aus Linz",      photos: 38,  attendees: 28 },
    { date: "5. Dez 2025",  title: "Jahresabschluss 2025",                       speaker: "Drei Beiträge, gemeinsames Dinner",          photos: 64,  attendees: 48 },
    { date: "10. Okt 2025", title: "Wiespach LXV · KI im Mittelstand.",          speaker: "Vortrag: Tech-Investor aus München",         photos: 41,  attendees: 30 },
    { date: "23. Aug 2025", title: "Sommerevent · Drei Tage am See.",            speaker: "Mehrtägig, gemischtes Programm",             photos: 112, attendees: 52 },
    { date: "18. Jun 2025", title: "Wiespach LXIV · Energiewende & Kapital.",    speaker: "Vortrag: Energie-Unternehmer aus Vorarlberg", photos: 36,  attendees: 26 },
    { date: "12. Apr 2025", title: "Frühjahrsevent · Verkauf & Nachfolge.",      speaker: "M&A Beirat, anonymisierter Deal-Case",       photos: 87,  attendees: 44 },
  ];

  return { nextEvent, upcoming, stats, albums, past };
}
