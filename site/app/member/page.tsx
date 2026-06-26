"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AuthBadge from "../../components/AuthBadge";
import SessionCta from "../../components/SessionCta";
import Fireworks, { type FireworksHandle } from "../../components/Fireworks";
import Footer from "../../components/Footer";
import { registerMember } from "../../components/member/auth";

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  postal_code: string;
  city: string;
  password: string;
  consent: boolean;
};

const EMPTY: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  postal_code: "",
  city: "",
  password: "",
  consent: false,
};

const MARQUEE = [
  "Nur für Mitglieder",
  "Erstes Jahr gratis",
  "Exklusive Events",
  "Preis-Ermäßigungen",
  "Danke für deine Treue",
];

const BENEFITS = [
  {
    title: "Erstes Jahr Mitgliedschaft gratis",
    desc:  "Volle Mitgliedschaft für 12 Monate — geschenkt, weil du von Anfang an dabei bist.",
    path:  "M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7S9 2 6.5 4 8 7 12 7Zm0 0s3-5 5.5-3S16 7 12 7Z",
  },
  {
    title: "Zugang zu exklusiven Events",
    desc:  "Eingeladen zu allen Deal Circle Abenden, Keynotes und Networking-Runden vor allen anderen.",
    path:  "M8 2v4M16 2v4M3 10h18",
    rect:  true,
  },
  {
    title: "Preis-Ermäßigungen für zukünftige Events",
    desc:  "Dauerhaft vergünstigte Tickets für alle kommenden Veranstaltungen des Deal Circle.",
    path:  "M9 7H6a3 3 0 0 0 0 6h3M15 17h3a3 3 0 0 0 0-6h-3M7 12h10",
  },
];

export default function VipPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fxRef = useRef<FireworksHandle>(null);

  // Subtiles Welcome-Feuerwerk wenn die Seite geoeffnet wird
  useEffect(() => {
    const id = window.setTimeout(() => fxRef.current?.welcome(), 450);
    return () => clearTimeout(id);
  }, []);

  // Body-Scroll-Lock + Escape waehrend Modal offen
  useEffect(() => {
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setModalOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [modalOpen]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!form.first_name.trim() || !form.last_name.trim() ||
        !form.email.trim() || !form.phone.trim() ||
        !form.address.trim() || !form.postal_code.trim() || !form.city.trim() ||
        !form.consent) {
      setError("Bitte alle Pflichtfelder ausfüllen und Einwilligung bestätigen.");
      return;
    }
    if (form.password.length < 8) {
      setError("Bitte ein Passwort mit mindestens 8 Zeichen wählen.");
      return;
    }

    setSubmitting(true);
    try {
      await registerMember({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim() || null,
        address: form.address.trim(),
        postal_code: form.postal_code.trim(),
        city: form.city.trim(),
        password: form.password,
        consent: form.consent,
      });
      setDone(true);
      setModalOpen(true);
      // Grosser Knall — Feuerwerk ausgehend von der Bildschirmmitte
      requestAnimationFrame(() => {
        fxRef.current?.celebrate(window.innerWidth / 2, window.innerHeight * 0.42);
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Anmeldung fehlgeschlagen.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dc-vip">
      <Fireworks ref={fxRef} />
      <header className="dc-vip-nav">
        <div className="dc-vip-wrap dc-vip-nav-in">
          <a href="/" className="dc-vip-brand" aria-label="DealCircle">
            <img src="/assets/logo-dc-white.svg" alt="" width={32} height={26} aria-hidden="true" />
            <span>DealCircle</span>
          </a>
          <div className="dc-vip-nav-right">
            <AuthBadge variant="dark" />
            <SessionCta joinHref="#anmelden" joinLabel="Jetzt aktivieren" className="dc-vip-nav-cta" />
          </div>
        </div>
      </header>

      <div className="dc-vip-marquee" aria-hidden="true">
        <div className="dc-vip-marquee-track">
          <span>{MARQUEE.join("  ·  ")}</span>
          <span>{MARQUEE.join("  ·  ")}</span>
        </div>
      </div>

      <main>
        <section className="dc-vip-hero">
          <div className="dc-vip-wrap">
            <span className="dc-vip-tag">
              <i aria-hidden="true" />
              Exklusiv für Bestandsmitglieder
            </span>
            <motion.h1
              className="dc-vip-h1"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              Dein erstes Jahr.<br /><span className="dc-vip-grad">Geschenkt.</span>
            </motion.h1>
            <motion.p
              className="dc-vip-lede"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              Du bist seit Tag eins in unserer WhatsApp-Runde dabei — und genau das zahlt sich
              jetzt aus. <b>Als Dankeschön für deine Treue schenken wir dir dein erstes Jahr
              Deal Circle Mitgliedschaft.</b> Inklusive Zugang zu exklusiven Events und
              dauerhaften Ermäßigungen.
            </motion.p>
          </div>
        </section>

        <div className="dc-vip-wrap">
          <div className="dc-vip-grid">
            <div>
              <motion.div
                className="dc-vip-gift"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="dc-vip-gift-k">Dein Treue-Bonus</div>
                <div className="dc-vip-gift-v">1 Jahr<br />Mitgliedschaft<br />gratis.</div>
                <p className="dc-vip-gift-d">
                  Kein Haken, keine versteckten Kosten. Einfach registrieren und dein Platz
                  im Circle ist gesichert.
                </p>
              </motion.div>

              <ul className="dc-vip-benefits">
                {BENEFITS.map((b, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-10%" }}
                    transition={{ duration: 0.5, delay: i * 0.06 }}
                  >
                    <span className="dc-vip-b-ico" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {b.rect && <rect x="3" y="4" width="18" height="18" rx="2" />}
                        <path d={b.path} />
                      </svg>
                    </span>
                    <div>
                      <div className="dc-vip-b-t">{b.title}</div>
                      <div className="dc-vip-b-d">{b.desc}</div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>

            <motion.div
              className={`dc-vip-form-card ${done ? "is-done" : ""}`}
              id="anmelden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              {!done ? (
                <>
                  <div className="dc-vip-form-head">Mitgliedschaft aktivieren</div>
                  <p className="dc-vip-form-sub">
                    Registriere dich in unter einer Minute — dein Gratis-Jahr startet sofort.
                  </p>
                  <form onSubmit={onSubmit} noValidate>
                    <div className="dc-vip-field dc-vip-field--row">
                      <div>
                        <label htmlFor="first">Vorname</label>
                        <input
                          id="first"
                          type="text"
                          autoComplete="given-name"
                          placeholder="Max"
                          value={form.first_name}
                          onChange={(e) => update("first_name", e.target.value)}
                          disabled={submitting}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="last">Nachname</label>
                        <input
                          id="last"
                          type="text"
                          autoComplete="family-name"
                          placeholder="Mustermann"
                          value={form.last_name}
                          onChange={(e) => update("last_name", e.target.value)}
                          disabled={submitting}
                          required
                        />
                      </div>
                    </div>
                    <div className="dc-vip-field">
                      <label htmlFor="email">E-Mail</label>
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="max@firma.at"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        disabled={submitting}
                        required
                      />
                    </div>
                    <div className="dc-vip-field">
                      <label htmlFor="phone">Telefonnummer</label>
                      <input
                        id="phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="+43 660 000 0000"
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        disabled={submitting}
                        required
                      />
                    </div>
                    <div className="dc-vip-field">
                      <label htmlFor="company">
                        Unternehmen <span className="dc-vip-optional">(optional)</span>
                      </label>
                      <input
                        id="company"
                        type="text"
                        autoComplete="organization"
                        placeholder="Firma GmbH"
                        value={form.company}
                        onChange={(e) => update("company", e.target.value)}
                        disabled={submitting}
                      />
                    </div>
                    <div className="dc-vip-field">
                      <label htmlFor="address">Straße &amp; Hausnummer</label>
                      <input
                        id="address"
                        type="text"
                        autoComplete="street-address"
                        placeholder="Musterstraße 1"
                        value={form.address}
                        onChange={(e) => update("address", e.target.value)}
                        disabled={submitting}
                        required
                      />
                    </div>
                    <div className="dc-vip-field dc-vip-field--row">
                      <div>
                        <label htmlFor="postal_code">PLZ</label>
                        <input
                          id="postal_code"
                          type="text"
                          autoComplete="postal-code"
                          placeholder="5400"
                          value={form.postal_code}
                          onChange={(e) => update("postal_code", e.target.value)}
                          disabled={submitting}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="city">Ort</label>
                        <input
                          id="city"
                          type="text"
                          autoComplete="address-level2"
                          placeholder="Hallein"
                          value={form.city}
                          onChange={(e) => update("city", e.target.value)}
                          disabled={submitting}
                          required
                        />
                      </div>
                    </div>
                    <div className="dc-vip-field">
                      <label htmlFor="password">Passwort wählen</label>
                      <input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Mindestens 8 Zeichen"
                        value={form.password}
                        onChange={(e) => update("password", e.target.value)}
                        disabled={submitting}
                        minLength={8}
                        required
                      />
                    </div>

                    <label className="dc-vip-consent">
                      <input
                        type="checkbox"
                        checked={form.consent}
                        onChange={(e) => update("consent", e.target.checked)}
                        disabled={submitting}
                      />
                      <span>
                        Ich möchte meine Gratis-Mitgliedschaft aktivieren und akzeptiere die{" "}
                        <a href="/datenschutz/" target="_blank" rel="noopener noreferrer">Datenschutzbestimmungen</a>.
                      </span>
                    </label>

                    {error && (
                      <div className="dc-vip-error" role="alert">{error}</div>
                    )}

                    <button type="submit" className="dc-vip-btn-submit" disabled={submitting}>
                      {submitting ? "Wird aktiviert …" : "Gratis-Mitgliedschaft aktivieren"}
                      {!submitting && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      )}
                    </button>
                    <p className="dc-vip-form-note">
                      Kostenlos für Bestandsmitglieder · Bestätigung per E-Mail
                    </p>
                  </form>
                </>
              ) : (
                <div className="dc-vip-success">
                  <div className="dc-vip-check" aria-hidden="true">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <h3>Willkommen im Circle.</h3>
                  <p>
                    Deine Gratis-Mitgliedschaft ist aktiviert. Du bekommst von uns innerhalb
                    weniger Tage persönlich deine Zugangsdaten an <b>{form.email}</b>.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="dc-vip-modal-ov"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dc-vip-modal-title"
            onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="dc-vip-modal"
              initial={{ opacity: 0, scale: 0.92, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.46, ease: [0.18, 0.9, 0.24, 1] }}
            >
              <button
                type="button"
                className="dc-vip-modal-close"
                onClick={() => setModalOpen(false)}
                aria-label="Schließen"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>

              <span className="dc-vip-modal-gift">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7S9 2 6.5 4 8 7 12 7Zm0 0s3-5 5.5-3S16 7 12 7Z" />
                </svg>
                1 Jahr Mitgliedschaft gratis
              </span>

              <h2 id="dc-vip-modal-title" className="dc-vip-modal-title">
                Willkommen<br />im Circle.
              </h2>

              <p className="dc-vip-modal-msg">
                Danke für deine Treue{form.first_name.trim() ? `, ${form.first_name.trim()}` : ""}.{" "}
                <b>Deine Mitgliedschaft ist aktiviert</b> — dein erstes Jahr geht aufs Haus.
              </p>

              <ul className="dc-vip-modal-list">
                <li>
                  <Check />
                  Erstes Jahr Mitgliedschaft — geschenkt
                </li>
                <li>
                  <Check />
                  Zugang zu exklusiven Events
                </li>
                <li>
                  <Check />
                  Preis-Ermäßigungen für zukünftige Events
                </li>
              </ul>

              <a
                href="/mitglieder/dashboard/"
                className="dc-vip-btn-submit dc-vip-modal-cta"
              >
                In den Mitgliederbereich
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>

              <p className="dc-vip-modal-hint">
                Bestätigung ist unterwegs in dein Postfach
                {form.email.trim() ? <> an <b>{form.email.trim()}</b></> : ""}.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Check() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
