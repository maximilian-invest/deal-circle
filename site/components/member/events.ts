"use client";
import { api, getToken } from "./api";
import type { EventDto, EventStatusApi, Speaker, Ticket, TimelineItem } from "./types";

export type CreateEventInput = {
  title: string;
  starts_at: string;
  location: string;
  status: EventStatusApi;
  fee_cents: number;
  max_attendees: number | null;
  description: string | null;
  cover_path: string | null;
  is_main: boolean;
  visibility: "public" | "members";
  member_discount_pct: number;
  timeline: TimelineItem[];
  speakers: Speaker[];
  tickets: Ticket[];
};

export type UpdateEventInput = Partial<CreateEventInput>;

export async function listEvents(): Promise<EventDto[]> {
  const data = await api<{ events: EventDto[] }>("/events");
  return data.events;
}

export async function createEvent(input: CreateEventInput): Promise<EventDto> {
  const data = await api<{ event: EventDto }>("/admin/events", {
    method: "POST",
    body: input,
  });
  return data.event;
}

export async function updateEvent(id: number, patch: UpdateEventInput): Promise<EventDto> {
  const data = await api<{ event: EventDto }>(`/admin/events/${id}`, {
    method: "PATCH",
    body: patch,
  });
  return data.event;
}

export async function deleteEvent(id: number): Promise<void> {
  await api(`/admin/events/${id}`, { method: "DELETE" });
}

// ========== Member registrations ==========
export type MyRegistration = {
  id: number;
  event_id: number;
  ticket_id: number | null;
  status: "reserved" | "paid" | "waitlist" | "cancelled";
  amount_cents: number | null;
  created_at: string;
  paid_at: string | null;
  event_title: string;
  starts_at: string;
  location: string;
  ticket_name: string | null;
};

export async function listMyRegistrations(): Promise<MyRegistration[]> {
  const data = await api<{ registrations: MyRegistration[] }>("/events/me/registrations");
  return data.registrations;
}

export async function registerForEvent(
  eventId: number,
  ticketId?: number | null
): Promise<{
  ok: boolean;
  registration: {
    id: number;
    event_id: number;
    ticket_id: number | null;
    status: string;
    amount_cents: number;
  };
}> {
  return api(`/events/${eventId}/register`, {
    method: "POST",
    body: { ticket_id: ticketId ?? null },
  });
}

export async function cancelRegistration(eventId: number): Promise<void> {
  await api(`/events/${eventId}/register`, { method: "DELETE" });
}

// Gast-Reservierung (ohne Login) für öffentliche Events.
export async function registerGuest(
  eventId: number,
  body: { name: string; email: string; ticket_id?: number | null }
): Promise<{ ok: boolean }> {
  return api(`/events/${eventId}/register-guest`, {
    method: "POST",
    body,
    auth: false,
  });
}

// ========== Admin: registrations + mail per event ==========
export type AdminRegistration = {
  id: number;
  status: "reserved" | "paid" | "waitlist" | "cancelled";
  amount_cents: number | null;
  created_at: string;
  paid_at: string | null;
  note: string | null;
  user_id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  ticket_id: number | null;
  ticket_name: string | null;
};

export type GuestRegistration = {
  id: number;
  status: "reserved" | "paid" | "cancelled";
  amount_cents: number | null;
  created_at: string;
  paid_at: string | null;
  name: string;
  email: string;
  ticket_id: number | null;
  ticket_name: string | null;
};

export async function listEventRegistrations(
  eventId: number
): Promise<{ registrations: AdminRegistration[]; guests: GuestRegistration[] }> {
  const data = await api<{ registrations: AdminRegistration[]; guests?: GuestRegistration[] }>(
    `/admin/events/${eventId}/registrations`
  );
  return { registrations: data.registrations, guests: data.guests ?? [] };
}

export async function updateRegistration(
  eventId: number, regId: number,
  patch: { status?: AdminRegistration["status"]; note?: string | null }
): Promise<void> {
  await api(`/admin/events/${eventId}/registrations/${regId}`, {
    method: "PATCH",
    body: patch,
  });
}

export type MailKind = "announcement" | "limited" | "soldout";

export type MailStats = {
  member_count: number;
  registered_count: number;
  history: Array<{
    id: number;
    kind: MailKind;
    recipient_count: number;
    created_at: string;
    triggered_by_name: string | null;
  }>;
};

export async function getMailStats(eventId: number): Promise<MailStats> {
  return api(`/admin/events/${eventId}/mail-stats`);
}

export async function sendEventMail(
  eventId: number,
  opts: { kind: MailKind; exclude_registered?: boolean; test_to_self?: boolean }
): Promise<{ ok: boolean; kind: MailKind; label: string; recipient_count: number; test: boolean }> {
  return api(`/admin/events/${eventId}/mail`, {
    method: "POST",
    body: opts,
  });
}

// Bild-Upload (kind = "speaker" oder "cover") — multipart/form-data
export async function uploadImage(kind: "speaker" | "cover", file: File): Promise<string> {
  const token = getToken();
  const fd = new FormData();
  fd.append("photo", file);

  const res = await fetch(`/api/uploads/${kind}`, {
    method: "POST",
    body: fd,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      res.status === 413 ? "Datei zu groß (max. 8 MB)" :
      res.status === 400 ? "Ungültiges Bildformat (JPG, PNG, WEBP)" :
      `Upload fehlgeschlagen (${res.status}) ${text}`
    );
  }

  const data = await res.json();
  return data.path as string;
}

// Backwards-compat Alias
export const uploadSpeakerPhoto = (file: File) => uploadImage("speaker", file);
export const uploadCoverImage = (file: File) => uploadImage("cover", file);

// ---------- Hilfs-Mappings für die Dashboard-UI ----------

const MONTH_SHORT = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const MONTH_LONG  = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

function fmtTime(d: Date): string {
  return d.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" }) + " Uhr";
}

export function isPast(e: EventDto, now = Date.now()): boolean {
  return new Date(e.starts_at).getTime() < now;
}

export function toUpcomingShape(e: EventDto) {
  const d = new Date(e.starts_at);
  return {
    id: `e${e.id}`,
    day: d.getDate(),
    month: MONTH_SHORT[d.getMonth()],
    monthLong: MONTH_LONG[d.getMonth()],
    title: e.title,
    time: fmtTime(d),
    location: e.location,
    status: e.status === "closed" ? ("paid" as const) : (e.status as "open" | "limited" | "waitlist"),
    fee: Math.round(e.fee_cents / 100),
  };
}

export function toNextEventShape(e: EventDto) {
  const d = new Date(e.starts_at);
  const dateLabel = d.toLocaleDateString("de-AT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }) + " · " + d.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" });

  return {
    id: e.id,
    iso: e.starts_at,
    title: e.title,
    dateLabel,
    location: e.location,
    attendees: e.max_attendees ?? 0,
    userStatus: "open" as const,
    checkoutUrl: e.checkout_url ?? null,
  };
}

export function toPastShape(e: EventDto) {
  const d = new Date(e.starts_at);
  const speakerLabel =
    e.speakers && e.speakers.length > 0
      ? e.speakers.map((s) => s.name).slice(0, 2).join(", ") + (e.speakers.length > 2 ? " u. a." : "")
      : "—";
  return {
    date: d.toLocaleDateString("de-AT", { day: "2-digit", month: "short", year: "numeric" }),
    title: e.title,
    speaker: speakerLabel,
    photos: 0,
    attendees: 0,
  };
}
