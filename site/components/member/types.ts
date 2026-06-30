export type EventStatus = "open" | "paid" | "limited" | "waitlist";

export type UpcomingEvent = {
  id: string;
  eventId: number;
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
  id: number;
  iso: string;
  title: string;
  dateLabel: string;
  location: string;
  attendees: number;
  userStatus: "open" | "paid";
  // Stripe Checkout / Payment Link des Events. Sobald Stripe live ist und das
  // Backend diese URL liefert, verlinkt "Jetzt anmelden" direkt dorthin;
  // bis dahin null → Fallback auf den bestehenden Anmelde-Flow.
  checkoutUrl?: string | null;
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
  | "antraege"
  | "events-admin"
  | "dashboard";

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
  member_discount_pct: number;
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
  // Stripe Checkout / Payment Link (optional, erst gesetzt sobald Stripe live ist).
  checkout_url?: string | null;
  // Main-Event → prominent auf der Startseite. Sichtbarkeit steuert, ob das
  // Event öffentlich ist oder nur eingeloggten Mitgliedern angezeigt wird.
  is_main: boolean;
  visibility: "public" | "members";
  // true = "Nicht sichtbar": Event ist für normale Mitglieder komplett
  // ausgeblendet (nur Admins sehen es im Admin-Bereich).
  hidden: boolean;
  // Mitglieder-Rabatt in Prozent (0–90). Eingeloggte Mitglieder zahlen
  // entsprechend weniger; 0 = kein Rabatt.
  member_discount_pct: number;
  // Anzahl nicht-stornierter Anmeldungen (Mitglieder + Gäste); von GET /events.
  registered?: number;
  // Anmeldestatus des eingeloggten Mitglieds für dieses Event (von GET /events).
  // "paid" => bereits bezahlt → kein Anmelde-Button mehr.
  my_status?: "reserved" | "paid" | "waitlist" | "cancelled" | null;
  timeline: TimelineItem[];
  speakers: Speaker[];
  tickets: Ticket[];
  created_at: string;
  updated_at: string | null;
};
