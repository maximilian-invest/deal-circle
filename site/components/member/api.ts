"use client";

const API_BASE =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE) || "/api";

const TOKEN_KEY = "dc-token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";
type ApiOptions = { method?: Method; body?: unknown; auth?: boolean };

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = opts;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError(0, "network", "Keine Verbindung zum Server.", err);
  }

  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
  }

  if (!res.ok) {
    const p = payload as { error?: string; details?: unknown } | null;
    const code = p?.error || `http_${res.status}`;
    throw new ApiError(res.status, code, errorMessage(code, res.status), p?.details);
  }

  return payload as T;
}

function errorMessage(code: string, status: number): string {
  switch (code) {
    case "invalid_credentials": return "E-Mail oder Passwort ist falsch.";
    case "invalid_input":       return "Eingabe ist nicht gültig.";
    case "unauthenticated":     return "Sitzung abgelaufen — bitte erneut anmelden.";
    case "invalid_token":       return "Sitzung ungültig — bitte erneut anmelden.";
    case "forbidden":           return "Keine Berechtigung.";
    case "too_many_attempts":   return "Zu viele Versuche — bitte einen Moment warten.";
    case "email_taken":         return "Diese E-Mail ist bereits vergeben.";
    case "last_admin":          return "Der letzte Admin kann nicht entfernt werden.";
    case "self_delete":         return "Eigener Account kann nicht gelöscht werden.";
    case "network":             return "Keine Verbindung zum Server.";
    case "token_expired":       return "Der Reset-Link ist abgelaufen — bitte einen neuen anfordern.";
    case "token_used":          return "Dieser Reset-Link wurde bereits verwendet.";
    case "invalid_token":       return "Reset-Link ungültig oder abgelaufen.";
    case "consent_required":    return "Bitte Einwilligung bestätigen.";
    case "nothing_to_update":   return "Keine Änderungen.";
    default:                    return `Fehler (${status || "?"}): ${code}`;
  }
}
