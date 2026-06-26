"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { login } from "../../../components/member/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !pwd) {
      setError("Bitte E-Mail und Passwort angeben.");
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), pwd);
      router.push("/mitglieder/dashboard/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Anmeldung fehlgeschlagen.");
      setSubmitting(false);
    }
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
            Hier findest du die nächsten Treffen, die Anmeldungen, vergangene
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
            Mit deinen persönlichen Zugangsdaten. Bei Problemen wende dich
            bitte an die Organisation.
          </p>

          <form className="mb-login-form-fields" onSubmit={onSubmit} noValidate>
            <div className="dc-field">
              <label htmlFor="email">E-Mail</label>
              <input
                type="email"
                id="email"
                autoComplete="email"
                placeholder="deine@adresse.at"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
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
                disabled={submitting}
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
              <a href="/mitglieder/passwort-zuruecksetzen/">Passwort vergessen?</a>
            </div>

            {error && <div className="mb-login-error" role="alert">{error}</div>}

            <button
              type="submit"
              className="dc-btn dc-btn-primary dc-btn--lg mb-login-cta"
              style={{ marginTop: 22 }}
              disabled={submitting}
            >
              {submitting ? "Anmelden …" : "Anmelden"}
            </button>
          </form>

          <p className="mb-login-foot">
            Noch kein Mitglied? <a href="/#kontakt">Auf Empfehlung beitreten →</a>
          </p>

          <p className="mb-login-legal">
            <a href="/impressum/">Impressum</a>
            <span aria-hidden="true"> · </span>
            <a href="/datenschutz/">Datenschutz</a>
          </p>
        </div>
      </motion.section>
    </main>
  );
}
