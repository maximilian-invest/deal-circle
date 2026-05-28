"use client";
import { useRouter } from "next/navigation";
import { signOut, type AuthState } from "./auth";
import type { TabKey } from "./types";

type Item = { id: TabKey; label: string; icon: keyof typeof PATHS; badge?: string };

const PATHS = {
  home:   "M3 11.5L12 4l9 7.5M5 10v10h14V10",
  cal:    "M3 7h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM8 3v4M16 3v4",
  photo:  "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6",
  people: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  doc:    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h6",
  user:   "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
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
  { id: "mitglieder", label: "Mitglieder",   icon: "people" },
  { id: "notizen",    label: "Aus dem Kreis", icon: "doc" },
];

const ACCOUNT: Item[] = [
  { id: "profil", label: "Profil", icon: "user" },
];

type Props = {
  active: TabKey;
  setActive: (k: TabKey) => void;
  auth: AuthState | null;
};

export default function Sidebar({ active, setActive, auth }: Props) {
  const router = useRouter();

  const initials = (auth?.email ?? "Mitglied")
    .split("@")[0]
    .split(/[.\-_]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "M";

  const onLogout = () => {
    signOut();
    router.push("/mitglieder/login");
  };

  return (
    <aside className="mb-sidebar">
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
        <nav className="mb-sidebar-nav">
          {MAIN.map((item) => (
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
      </div>

      <div>
        <div className="mb-sidebar-section-label">Konto</div>
        <nav className="mb-sidebar-nav">
          {ACCOUNT.map((item) => (
            <a
              key={item.id}
              className="mb-sidebar-nav-item"
              data-active={active === item.id ? "true" : "false"}
              onClick={(e) => { e.preventDefault(); setActive(item.id); }}
              href={"#" + item.id}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </div>

      <div className="mb-sidebar-profile">
        <div className="mb-sidebar-profile-avatar">{initials}</div>
        <div className="mb-sidebar-profile-info">
          <span className="mb-sidebar-profile-name">{auth?.email ?? "Mitglied"}</span>
          <span className="mb-sidebar-profile-role">Mitglied seit 2024</span>
        </div>
        <button className="mb-sidebar-profile-logout" title="Abmelden" onClick={onLogout}>
          <Icon name="logout" />
        </button>
      </div>
    </aside>
  );
}
