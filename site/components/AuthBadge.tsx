"use client";
import { useEffect, useState } from "react";
import { fetchMe, type AuthUser } from "./member/auth";

type Props = {
  variant?: "dark" | "light"; // dark = white pill on dark BG (default), light = inverted
};

/**
 * Klein, client-only, schaut nach ob ein gueltiges Token im sessionStorage
 * liegt. Rendert:
 *   - kein token oder fetchMe failed → "Login" (Standard-CTA)
 *   - role=admin → glowing Admin-Pille
 *   - role=member → "Mitgliederbereich"-Link
 */
export default function AuthBadge({ variant = "dark" }: Props) {
  const [state, setState] = useState<"loading" | "anon" | AuthUser>("loading");

  useEffect(() => {
    let cancelled = false;
    fetchMe().then((u) => {
      if (cancelled) return;
      setState(u || "anon");
    });
    return () => { cancelled = true; };
  }, []);

  // Während Loading kein Layout-Shift — render unsichtbares Placeholder
  if (state === "loading") {
    return <span className="dc-auth-badge dc-auth-badge--placeholder" aria-hidden="true" />;
  }

  if (state === "anon") {
    return (
      <a
        href="/mitglieder/login/"
        className={`dc-auth-badge dc-auth-badge--login dc-auth-badge--${variant}`}
      >
        Login
      </a>
    );
  }

  // Eingeloggt
  if (state.role === "admin") {
    return (
      <a
        href="/mitglieder/dashboard/"
        className="dc-auth-badge dc-auth-badge--admin"
        title={`Admin: ${state.email}`}
      >
        <span className="dc-auth-badge-dot" aria-hidden="true" />
        <span className="dc-auth-badge-label">Admin</span>
        <span className="dc-auth-badge-name">{state.name || state.email}</span>
      </a>
    );
  }

  // Member
  return (
    <a
      href="/mitglieder/dashboard/"
      className={`dc-auth-badge dc-auth-badge--member dc-auth-badge--${variant}`}
    >
      Mitgliederbereich
    </a>
  );
}
