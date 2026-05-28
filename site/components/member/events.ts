"use client";
import { api } from "./api";
import type { EventDto, EventStatusApi } from "./types";

export type CreateEventInput = {
  title: string;
  starts_at: string;
  time_label: string;
  location: string;
  status: EventStatusApi;
  fee_cents: number;
  max_attendees: number | null;
  confirmed_count: number;
  description: string | null;
  speaker: string | null;
  photo_count: number;
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

// ---------- Hilfs-Mappings für die Dashboard-UI ----------

const MONTH_SHORT = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const MONTH_LONG  = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

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
    time: e.time_label,
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
    confirmed: e.confirmed_count,
    userStatus: "open" as const,
  };
}

export function toPastShape(e: EventDto) {
  const d = new Date(e.starts_at);
  return {
    date: d.toLocaleDateString("de-AT", { day: "2-digit", month: "short", year: "numeric" }),
    title: e.title,
    speaker: e.speaker ?? "—",
    photos: e.photo_count,
    attendees: e.confirmed_count,
  };
}
