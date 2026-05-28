"use client";

const KEY = "dc-auth";

export type AuthState = { email: string; ts: number };

export function signIn(email: string): void {
  if (typeof window === "undefined") return;
  const state: AuthState = { email, ts: Date.now() };
  window.sessionStorage.setItem(KEY, JSON.stringify(state));
}

export function signOut(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(KEY);
}

export function getAuth(): AuthState | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    return null;
  }
}
