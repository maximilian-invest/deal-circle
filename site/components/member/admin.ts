"use client";
import { api } from "./api";
import type { Role } from "./auth";

export type AdminUser = {
  id: number;
  email: string;
  name: string;
  role: Role;
  phone: string | null;
  company: string | null;
  created_at: string;
  last_login_at: string | null;
};

export async function listUsers(): Promise<AdminUser[]> {
  const data = await api<{ users: AdminUser[] }>("/admin/users");
  return data.users;
}

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
  role: Role;
}): Promise<AdminUser> {
  const data = await api<{ user: AdminUser }>("/admin/users", {
    method: "POST",
    body: input,
  });
  return data.user;
}

export async function updateUser(
  id: number,
  patch: { name?: string; password?: string; role?: Role }
): Promise<AdminUser> {
  const data = await api<{ user: AdminUser }>(`/admin/users/${id}`, {
    method: "PATCH",
    body: patch,
  });
  return data.user;
}

export async function deleteUser(id: number): Promise<void> {
  await api(`/admin/users/${id}`, { method: "DELETE" });
}

// ---------- Finanzen / Einnahmen-Dashboard ----------
export type FinancePayer = {
  name: string;
  company: string | null;
  ticket: string;
  vip: boolean;
  price_cents: number;
  paid_at: string | null;
  method: string;
  kind: "member" | "guest";
};

export type FinanceEvent = {
  id: number;
  title: string;
  starts_at: string;
  location: string;
  status: "open" | "limited" | "waitlist" | "closed";
  revenue_cents: number;
  ticket_count: number;
  std_rev_cents: number;
  vip_rev_cents: number;
  std_count: number;
  vip_count: number;
  categories: { name: string; featured: boolean; count: number }[];
  payers: FinancePayer[];
};

export async function getFinance(): Promise<FinanceEvent[]> {
  const data = await api<{ events: FinanceEvent[] }>("/admin/finance");
  return data.events;
}
