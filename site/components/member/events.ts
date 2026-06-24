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
    iso: e.starts_at,
    title: e.title,
    dateLabel,
    location: e.location,
    attendees: e.max_attendees ?? 0,
    userStatus: "open" as const,
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
