"use client";
import { api, clearToken, setToken } from "./api";

export type Role = "admin" | "member";

export type AuthUser = {
  email: string;
  name: string;
  role: Role;
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

export function logout(): void {
  clearToken();
}
