"use client";
import { api } from "./member/api";

// Öffentlicher Aufnahme-Antrag (Mitglied-werden-Seite) + Admin-Verwaltung.

export type ApplicationInput = {
  name: string;
  email: string;
  phone: string;
  street: string;
  zip: string;
  city: string;
  country: string;
  company: string;
  website?: string;
  role?: string;
  about: string;
  referral?: string;
};

export type Application = {
  id: number;
  name: string;
  email: string;
  phone: string;
  street: string;
  postal_code: string;
  city: string;
  country: string;
  company: string;
  website: string | null;
  role: string | null;
  about: string;
  referral: string | null;
  status: "pending" | "accepted" | "rejected";
  note: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: number | null;
};

export async function submitApplication(input: ApplicationInput): Promise<void> {
  await api("/applications", { method: "POST", body: input, auth: false });
}

export async function listApplications(
  status: "pending" | "accepted" | "rejected" | "all" = "pending"
): Promise<{ applications: Application[]; pending_count: number }> {
  return api(`/applications?status=${encodeURIComponent(status)}`);
}

export async function acceptApplication(id: number): Promise<void> {
  await api(`/applications/${id}/accept`, { method: "POST" });
}

export async function rejectApplication(id: number, note?: string): Promise<void> {
  await api(`/applications/${id}/reject`, { method: "POST", body: note ? { note } : {} });
}
