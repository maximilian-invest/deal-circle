"use client";
import { api, clearToken, setToken } from "./api";

export type Role = "admin" | "member";

export type AuthUser = {
  email: string;
  name: string;
  role: Role;
};

export type Profile = {
  id: number;
  email: string;
  name: string;
  role: Role;
  phone: string | null;
  company: string | null;
  created_at: string;
  last_login_at: string | null;
};

export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await api<{ token: string; user: AuthUser }>("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
  setToken(data.token);
  return data.user;
}

export async function fetchMe(): Promise<AuthUser | null> {
  try {
    const data = await api<{ user: AuthUser }>("/auth/me");
    return data.user;
  } catch {
    return null;
  }
}

export async function fetchProfile(): Promise<Profile> {
  const data = await api<{ profile: Profile }>("/auth/me/profile");
  return data.profile;
}

export async function updateProfile(
  patch: { name?: string; phone?: string | null; company?: string | null }
): Promise<Profile> {
  const data = await api<{ profile: Profile }>("/auth/me/profile", {
    method: "PATCH",
    body: patch,
  });
  return data.profile;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api("/auth/me/password", {
    method: "POST",
    body: { current_password: currentPassword, new_password: newPassword },
  });
}

export async function requestPasswordReset(email: string): Promise<void> {
  await api("/auth/password-reset/request", {
    method: "POST",
    body: { email },
    auth: false,
  });
}

export async function confirmPasswordReset(token: string, newPassword: string): Promise<void> {
  await api("/auth/password-reset/confirm", {
    method: "POST",
    body: { token, new_password: newPassword },
    auth: false,
  });
}

export type RegisterInput = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string | null;
  password: string;
  consent: boolean;
};

export async function registerMember(input: RegisterInput): Promise<{ token: string; user: AuthUser }> {
  const data = await api<{ token: string; user: AuthUser }>("/member/register", {
    method: "POST",
    body: input,
    auth: false,
  });
  setToken(data.token);
  return data;
}

export function logout(): void {
  clearToken();
}
