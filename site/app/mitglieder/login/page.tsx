"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signIn } from "../../../components/member/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState<"none" | "form" | "magic">("none");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting("form");
    signIn(email.trim());
    setTimeout(() => router.push("/mitglieder/dashboard"), 600);
  };

  const onMagic = () => {
    if (!email.trim()) {
      const input = document.getElementById("email") as HTMLInputElement | null;
      input?.focus();
      return;
    }
    setSubmitting("magic");
    signIn(email.trim());
    setTimeout(() => router.push("/mitglieder/dashboard"), 800);
  };

  return (
    <main className="mb-login">
      <motion.section
        className="mb-login-brand"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-login-brand-aura" aria-hidden="true" />
        <div className="mb-login-brand-aura-b" aria-hidden="true" />

        <a href="/" className="mb-login-brand-top">
          <img
            src="/assets/logo-dc-white.svg"
            alt=""
            width={36}
            height={29}
            className="dc-nav-logo"
            aria-hidden="true"
          />
          <span className="mb-login-brand-wordmark">DealCircle</span>
          <span className="mb-login-brand-tag">Salzburg</span>
        </a>

        <div className="mb-login-brand-inner">
          <h1 className="mb-login-brand-headline">Willkommen<br />im inneren Kreis.</h1>
          <p className="mb-login-brand-quote">
            Hier finden Sie die nächsten Treffen, die Anmeldungen, vergangene
            Abende und alles, was im Raum besprochen wurde — dokumentiert für
            den Kreis, geteilt nur unter Mitgliedern.
          </p>
        </div>

        <div className="mb-login-brand-foot">
          <span>Schloss Wiespach · Hallein · Salzburger Land</span>
          <span>Zugang auf persönliche Empfehlung</span>
        </div>
      </motion.section>

      <motion.section
        className="mb-login-form"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <div className="mb-login-form-inner">
          <span className="mb-login-eyebrow">
            <span className="mb-login-eyebrow-dot" aria-hidden="true" />
            Mitgliederbereich
          </span>
          <h2 className="mb-login-title">Anmelden.</h2>
          <p className="mb-login-sub">
            Mit Ihren Zugangsdaten oder per Magic Link an Ihre hinterlegte
            E-Mail-Adresse.
          </p>

          <form className="mb-login-form-fields" onSubmit={onSubmit} noValidate>
            <div className="dc-field">
              <label htmlFor="email">E-Mail</label>
              <input
                type="email"
                id="email"
                autoComplete="email"
                placeholder="ihre@adresse.at"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="dc-field" style={{ marginTop: 14 }}>
              <label htmlFor="pwd">Passwort</label>
              <input
                type="password"
                id="pwd"
                autoComplete="current-password"
                placeholder="••••••••"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                required
              />
            </div>

            <div className="mb-login-row-between" style={{ marginTop: 14 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "var(--color-ink-muted)" }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{ accentColor: "var(--color-accent-blue)" }}
                />
                Angemeldet bleiben
              </label>
              <a href="#" onClick={(e) => e.preventDefault()}>Passwort vergessen?</a>
            </div>

            <button
              type="submit"
              className="dc-btn dc-btn-primary dc-btn--lg mb-login-cta"
              style={{ marginTop: 22 }}
              disabled={submitting !== "none"}
            >
              {submitting === "form" ? "Anmelden …" : "Anmelden"}
            </button>
          </form>

          <div className="mb-login-divider">oder</div>

          <button
            type="button"
            className="dc-btn dc-btn-secondary dc-btn--lg mb-login-cta"
            onClick={onMagic}
            disabled={submitting !== "none"}
          >
            {submitting === "magic" ? "Link gesendet ✓" : "Magic Link senden"}
          </button>

          <p className="mb-login-foot">
            Noch kein Mitglied? <a href="/#kontakt">Auf Empfehlung beitreten →</a>
          </p>
        </div>
      </motion.section>
    </main>
  );
}
