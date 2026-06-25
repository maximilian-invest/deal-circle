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
  | "verwaltung"
  | "events-admin";

export type EventStatusApi = "open" | "limited" | "waitlist" | "closed";

export type TimelineItem = {
  id?: number;
  time_label: string;
  label: string;
};

export type Speaker = {
  id?: number;
  name: string;
  bio: string | null;
  photo_path: string | null;
};

export type Ticket = {
  id?: number;
  name: string;
  badge: string | null;
  featured: boolean;
  price_cents: number;
  perks: string[];
};

export type EventDto = {
  id: number;
  title: string;
  starts_at: string;
  location: string;
  status: EventStatusApi;
  fee_cents: number;
  max_attendees: number | null;
  description: string | null;
  cover_path: string | null;
  timeline: TimelineItem[];
  speakers: Speaker[];
  tickets: Ticket[];
  created_at: string;
  updated_at: string | null;
};
