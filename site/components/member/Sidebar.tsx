"use client";
import { useEffect, useState } from "react";
import { logout, type AuthUser } from "./auth";
import type { TabKey } from "./types";

type Item = { id: TabKey; label: string; icon: keyof typeof PATHS; badge?: string; adminOnly?: boolean };

const PATHS = {
  home:    "M3 11.5L12 4l9 7.5M5 10v10h14V10",
  cal:     "M3 7h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM8 3v4M16 3v4",
  photo:   "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6",
  people:  "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  doc:     "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h6",
  user:    "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  logout:  "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  shield:  "M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z",
} as const;

const Icon = ({ name }: { name: keyof typeof PATHS }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d={PATHS[name]} />
  </svg>
);

const MAIN: Item[] = [
  { id: "uebersicht", label: "Übersicht",    icon: "home" },
  { id: "events",     label: "Events",       icon: "cal", badge: "2" },
  { id: "galerie",    label: "Galerie",      icon: "photo" },
  { id: "mitglieder", label: "Mitglieder",   icon: "people", adminOnly: true },
  { id: "notizen",    label: "Aus dem Kreis", icon: "doc" },
];

const ACCOUNT: Item[] = [
  { id: "profil", label: "Profil", icon: "user" },
];

const ADMIN: Item[] = [
  { id: "events-admin", label: "Events verwalten",    icon: "cal" },
  { id: "verwaltung",   label: "Mitglieder verwalten", icon: "shield" },
];

type Props = {
  active: TabKey;
  setActive: (k: TabKey) => void;
  user: AuthUser;
};

export default function Sidebar({ active, setActive, user }: Props) {
  const [open, setOpen] = useState(false);
  const isAdmin = user.role === "admin";

  // Drawer schließt sich, wenn ein Tab gewechselt wird
  useEffect(() => { setOpen(false); }, [active]);

  // Body-Scroll lock + Escape-to-close, solange offen
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initials = (user.name || user.email)
    .split(/\s+|@|[.\-_]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "M";

  const onLogout = () => {
    logout();
    window.location.href = "/mitglieder/login/";
  };

  const renderNav = (items: Item[]) => {
    const visible = items.filter((i) => !i.adminOnly || isAdmin);
    if (visible.length === 0) return null;
    return (
      <nav className="mb-sidebar-nav">
        {visible.map((item) => (
          <a
            key={item.id}
            className="mb-sidebar-nav-item"
            data-active={active === item.id ? "true" : "false"}
            onClick={(e) => { e.preventDefault(); setActive(item.id); }}
            href={"#" + item.id}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
            {item.badge ? <span className="mb-sidebar-nav-item-badge">{item.badge}</span> : null}
          </a>
        ))}
      </nav>
    );
  };

  const activeLabel =
    [...MAIN, ...ACCOUNT, ...ADMIN].find((i) => i.id === active)?.label ?? "Mitgliederbereich";

  return (
    <>
      {/* Mobile-Topbar: Brand + aktueller Tab + Hamburger */}
      <header className="mb-mobile-topbar" role="banner">
        <a href="/" className="mb-mobile-topbar-brand" aria-label="DealCircle Startseite">
          <img
            src="/assets/logo-dc-white.svg"
            alt=""
            width={26}
            height={20}
            className="dc-nav-logo"
            aria-hidden="true"
          />
          <span className="mb-mobile-topbar-section">{activeLabel}</span>
        </a>
        <button
          type="button"
          className="mb-mobile-menu-btn"
          onClick={() => setOpen(true)}
          aria-label="Menü öffnen"
          aria-expanded={open}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </header>

      {/* Backdrop nur sichtbar wenn Drawer offen */}
      {open && (
        <div
          className="mb-mobile-backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`mb-sidebar ${open ? "mb-sidebar--open" : ""}`} aria-label="Mitgliederbereich-Navigation">
        <button
          type="button"
          className="mb-mobile-close-btn"
          onClick={() => setOpen(false)}
          aria-label="Menü schließen"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <a href="/" className="mb-sidebar-brand">
          <img
            src="/assets/logo-dc-white.svg"
            alt=""
            width={28}
            height={22}
            className="dc-nav-logo"
            aria-hidden="true"
          />
          <span className="mb-sidebar-brand-wordmark">DealCircle</span>
          <span className="mb-sidebar-brand-tag">Salzburg</span>
        </a>

        <div>
          <div className="mb-sidebar-section-label">Mitgliederbereich</div>
          {renderNav(MAIN)}
        </div>

        <div>
          <div className="mb-sidebar-section-label">Konto</div>
          {renderNav(ACCOUNT)}
        </div>

        {isAdmin && (
          <div>
            <div className="mb-sidebar-section-label">Admin</div>
            {renderNav(ADMIN)}
          </div>
        )}

        <div className="mb-sidebar-profile">
          <div className="mb-sidebar-profile-avatar">{initials}</div>
          <div className="mb-sidebar-profile-info">
            <span className="mb-sidebar-profile-name">{user.name}</span>
            <span className="mb-sidebar-profile-role">
              {isAdmin ? "Administrator" : "Mitglied"}
            </span>
          </div>
          <button className="mb-sidebar-profile-logout" title="Abmelden" onClick={onLogout}>
            <Icon name="logout" />
          </button>
        </div>
      </aside>
    </>
  );
}
