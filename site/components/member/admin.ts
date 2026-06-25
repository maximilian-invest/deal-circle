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
