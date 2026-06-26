"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { confirmPasswordReset, requestPasswordReset } from "../../../components/member/auth";

function RequestForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Anfrage fehlgeschlagen.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="mb-login-form-inner">
        <span className="mb-login-eyebrow">
          <span className="mb-login-eyebrow-dot" aria-hidden="true" />
          Passwort zurücksetzen
        </span>
        <h2 className="mb-login-title">Mail unterwegs.</h2>
        <p className="mb-login-sub">
          Falls für <b>{email}</b> ein Account existiert, ist eine Mail
          mit dem Reset-Link unterwegs. Der Link gilt 60 Minuten.
        </p>
        <p className="mb-login-foot">
          <a href="/mitglieder/login/">Zurück zum Login</a>
        </p>
      </div>
    );
  }

  return (
    <div className="mb-login-form-inner">
      <span className="mb-login-eyebrow">
        <span className="mb-login-eyebrow-dot" aria-hidden="true" />
        Passwort zurücksetzen
      </span>
      <h2 className="mb-login-title">Neues Passwort.</h2>
      <p className="mb-login-sub">
        Gib deine E-Mail-Adresse ein — wir schicken dir einen Link zum
        Setzen eines neuen Passworts.
      </p>
      <form className="mb-login-form-fields" onSubmit={onSubmit} noValidate>
        <div className="dc-field">
          <label htmlFor="reset-email">E-Mail</label>
          <input
            id="reset-email"
            type="email"
            autoComplete="email"
            placeholder="deine@adresse.at"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            required
          />
        </div>
        {error && <div className="mb-login-error" role="alert">{error}</div>}
        <button
          type="submit"
          className="dc-btn dc-btn-primary dc-btn--lg mb-login-cta"
          style={{ marginTop: 22 }}
          disabled={submitting}
        >
          {submitting ? "Sende Link …" : "Reset-Link senden"}
        </button>
      </form>
      <p className="mb-login-foot">
        <a href="/mitglieder/login/">← Zurück zum Login</a>
      </p>
    </div>
  );
}

function ConfirmForm({ token }: { token: string }) {
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (pwd.length < 8) { setError("Passwort muss mindestens 8 Zeichen haben."); return; }
    if (pwd !== pwd2) { setError("Die beiden Passwörter stimmen nicht überein."); return; }

    setSubmitting(true);
    try {
      await confirmPasswordReset(token, pwd);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset fehlgeschlagen.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mb-login-form-inner">
        <span className="mb-login-eyebrow">
          <span className="mb-login-eyebrow-dot" aria-hidden="true" />
          Erledigt
        </span>
        <h2 className="mb-login-title">Passwort gesetzt.</h2>
        <p className="mb-login-sub">
          Du kannst dich ab sofort mit deinem neuen Passwort einloggen.
        </p>
        <a
          href="/mitglieder/login/"
          className="dc-btn dc-btn-primary dc-btn--lg mb-login-cta"
          style={{ marginTop: 22, textAlign: "center" }}
        >
          Zum Login
        </a>
      </div>
    );
  }

  return (
    <div className="mb-login-form-inner">
      <span className="mb-login-eyebrow">
        <span className="mb-login-eyebrow-dot" aria-hidden="true" />
        Neues Passwort
      </span>
      <h2 className="mb-login-title">Passwort wählen.</h2>
      <p className="mb-login-sub">
        Wähle dein neues Passwort — mindestens 8 Zeichen.
      </p>
      <form className="mb-login-form-fields" onSubmit={onSubmit} noValidate>
        <div className="dc-field">
          <label htmlFor="pw1">Neues Passwort</label>
          <input
            id="pw1"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            disabled={submitting}
            minLength={8}
            required
          />
        </div>
        <div className="dc-field" style={{ marginTop: 14 }}>
          <label htmlFor="pw2">Passwort wiederholen</label>
          <input
            id="pw2"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={pwd2}
            onChange={(e) => setPwd2(e.target.value)}
            disabled={submitting}
            minLength={8}
            required
          />
        </div>
        {error && <div className="mb-login-error" role="alert">{error}</div>}
        <button
          type="submit"
          className="dc-btn dc-btn-primary dc-btn--lg mb-login-cta"
          style={{ marginTop: 22 }}
          disabled={submitting}
        >
          {submitting ? "Speichern …" : "Neues Passwort setzen"}
        </button>
      </form>
    </div>
  );
}

function Inner() {
  const params = useSearchParams();
  const token = params.get("token") || "";

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
          <img src="/assets/logo-dc-white.svg" alt="" width={36} height={29} className="dc-nav-logo" aria-hidden="true" />
          <span className="mb-login-brand-wordmark">DealCircle</span>
          <span className="mb-login-brand-tag">Salzburg</span>
        </a>
        <div className="mb-login-brand-inner">
          <h1 className="mb-login-brand-headline">
            {token ? <>Neues<br/>Passwort.</> : <>Passwort<br/>vergessen?</>}
          </h1>
          <p className="mb-login-brand-quote">
            Sicher und schnell: über deine hinterlegte E-Mail-Adresse setzt
            du in wenigen Sekunden ein neues Passwort.
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
        {token ? <ConfirmForm token={token} /> : <RequestForm />}
      </motion.section>
    </main>
  );
}

export default function PasswordResetPage() {
  return (
    <Suspense fallback={<main className="mb-login"><div /></main>}>
      <Inner />
    </Suspense>
  );
}
