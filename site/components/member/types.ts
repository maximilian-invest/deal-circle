export type EventStatus = "open" | "paid" | "limited" | "waitlist";

export type UpcomingEvent = {
  id: string;
  day: number;
  month: string;
  monthLong: string;
  title: string;
  time: string;
  location: string;
  status: EventStatus;
  fee: number;
};

export type NextEventData = {
  iso: string;
  title: string;
  dateLabel: string;
  location: string;
  attendees: number;
  confirmed: number;
  userStatus: "open" | "paid";
};

export type StatItem = { label: string; value: string; note: string };

export type AlbumTone = "violet" | "magenta" | "orange" | "coral" | "dusk";
export type Album = { title: string; meta: string; count: number; tone: AlbumTone };

export type PastEventItem = {
  date: string;
  title: string;
  speaker: string;
  photos: number;
  attendees: number;
};

export type TabKey =
  | "uebersicht"
  | "events"
  | "galerie"
  | "mitglieder"
  | "notizen"
  | "profil"
  | "verwaltung";
