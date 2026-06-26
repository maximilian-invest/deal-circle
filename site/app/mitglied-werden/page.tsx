"use client";
import { useState } from "react";
import RevealManager from "../../components/RevealManager";
import Footer from "../../components/Footer";
import AuthBadge from "../../components/AuthBadge";
import { submitApplication } from "../../components/applications";

type FormState = {
  name: string; email: string; phone: string;
  street: string; zip: string; city: string; country: string;
  company: string; website: string; role: string;
  about: string; referral: string;
};
type Errors = Partial<Record<keyof FormState, string>>;

const EMPTY: FormState = {
  name: "", email: "", phone: "",
  street: "", zip: "", city: "", country: "Österreich",
  company: "", website: "", role: "",
  about: "", referral: "",
};

const STEP_LABELS = ["Deine Person", "Adresse", "Unternehmen", "Über dich"];
const STEP_FIELDS: (keyof FormState)[][] = [
  ["name", "email", "phone"],
  ["street", "zip", "city", "country"],
  ["company", "role"],
  ["about"],
];
const TOTAL = STEP_LABELS.length;

function Nav() {
  return (
    <header className="dc-nav">
      <div className="dc-nav-inner">
        <a href="/" className="dc-nav-brand" aria-label="DealCircle Salzburg">
          <img src="/assets/logo-dc-white.svg" alt="" width={36} height={29} className="dc-nav-logo" aria-hidden="true" />
          <span className="dc-nav-wordmark">DealCircle</span>
          <span className="dc-nav-tag">Salzburg</span>
        </a>
        <nav className="dc-nav-links" aria-label="Hauptnavigation">
          <a href="/#konzept">Konzept</a>
          <a href="/#format">Format</a>
          <a href="/#mitglieder">Mitglieder</a>
          <a href="/#team">Team</a>
          <a href="/#faq">FAQ</a>
        </nav>
        <div className="dc-nav-cta">
          <AuthBadge variant="dark" />
          <a href="/mitglieder/login/" className="dc-btn dc-btn-secondary" style={{ marginRight: 4 }}>Mitglieder-Login</a>
          <a href="#antrag" className="dc-btn dc-btn-primary">Antrag stellen</a>
        </div>
      </div>
    </header>
  );
}

function Intro() {
  const steps = [
    { n: "Schritt 01", h: "Antrag", b: "Du hinterlässt deine Angaben und ein paar Sätze zu deiner Person. Keine Zahlung, keine Verpflichtung." },
    { n: "Schritt 02", h: "Prüfung", b: "Wir sehen uns in Ruhe an, ob dein Profil zum Kreis passt — und melden uns innerhalb von zehn Tagen persönlich." },
    { n: "Schritt 03", h: "Aufnahme", b: "Erst nach einem persönlichen Gespräch und gegenseitigem Ja wird der Mitgliedsbeitrag fällig." },
  ];
  return (
    <section className="mw-top">
      <div className="mw-aura" aria-hidden="true" />
      <div className="mw-top-inner">
        <div className="mw-head">
          <div className="mw-eyebrow dc-eyebrow"><span className="dc-hero-eyebrow-dot" />Mitglied werden</div>
          <h1 className="mw-title">Erst kennenlernen.<br />Dann beitreten.</h1>
          <p className="mw-lede">
            Der DealCircle ist ein kuratierter Kreis. Bevor jemand dazustößt,
            sehen wir gemeinsam, ob es passt. Dieses Formular ist dein Antrag —
            bezahlt wird hier nichts.
          </p>
        </div>

        <div className="mw-fee">
          <div className="mw-fee-amount">
            <span className="mw-fee-number">79 €</span>
            <span className="mw-fee-sub">pro Monat · zzgl. MwSt.</span>
          </div>
          <div className="mw-fee-divider" aria-hidden="true" />
          <div className="mw-fee-note">
            <p className="mw-fee-note-h">Der Beitrag wird hier nicht eingezogen.</p>
            <p className="mw-fee-note-b">
              Er gilt erst, wenn wir uns kennengelernt und beide Seiten zugestimmt
              haben. Der Antrag selbst ist kostenlos und unverbindlich.
            </p>
          </div>
        </div>

        <div className="mw-steps">
          {steps.map((s) => (
            <div key={s.n} className="mw-step">
              <span className="mw-step-num">{s.n}</span>
              <h3 className="mw-step-h">{s.h}</h3>
              <p className="mw-step-b">{s.b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Antrag() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const update = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setForm((f) => ({ ...f, [field]: value }));
      if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    };
  const setRole = (role: string) => {
    setForm((f) => ({ ...f, role }));
    if (errors.role) setErrors((prev) => { const n = { ...prev }; delete n.role; return n; });
  };

  const allErrors = (): Errors => {
    const e: Errors = {};
    if (!form.name.trim()) e.name = "Bitte deinen Namen angeben.";
    if (!form.email.trim()) e.email = "Bitte eine E-Mail-Adresse angeben.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Diese E-Mail-Adresse sieht nicht gültig aus.";
    if (!form.phone.trim()) e.phone = "Bitte eine Telefonnummer angeben.";
    if (!form.street.trim()) e.street = "Bitte Straße und Hausnummer angeben.";
    if (!form.zip.trim()) e.zip = "PLZ fehlt.";
    if (!form.city.trim()) e.city = "Bitte den Ort angeben.";
    if (!form.country.trim()) e.country = "Bitte das Land angeben.";
    if (!form.company.trim()) e.company = "Bitte dein Unternehmen angeben.";
    if (!form.role) e.role = "Bitte wähle deine Rolle.";
    if (!form.about.trim() || form.about.trim().length < 40) e.about = "Ein paar Sätze helfen uns einzuschätzen, ob es passt (mind. 40 Zeichen).";
    return e;
  };
  const errorsForStep = (s: number, all: Errors): Errors => {
    const e: Errors = {};
    STEP_FIELDS[s].forEach((k) => { if (all[k]) e[k] = all[k]; });
    return e;
  };

  const scrollToTop = () => {
    const el = document.getElementById("antrag");
    if (el) window.scrollTo({ top: el.offsetTop - 20, behavior: "smooth" });
  };
  const focusFirstInvalid = () => {
    requestAnimationFrame(() => {
      const first = document.querySelector<HTMLElement>('.dc-field[data-invalid="true"] input, .dc-field[data-invalid="true"] textarea');
      if (first) first.focus();
    });
  };

  const goNext = () => {
    const errs = errorsForStep(step, allErrors());
    setErrors(errs);
    if (Object.keys(errs).length) { focusFirstInvalid(); return; }
    setStep((s) => Math.min(TOTAL - 1, s + 1));
    scrollToTop();
  };
  const goBack = () => {
    setErrors({});
    setStep((s) => Math.max(0, s - 1));
    scrollToTop();
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step < TOTAL - 1) { goNext(); return; }
    const errs = allErrors();
    setErrors(errs);
    if (Object.keys(errs).length) {
      for (let s = 0; s < TOTAL; s++) {
        if (STEP_FIELDS[s].some((k) => errs[k])) { setStep(s); break; }
      }
      scrollToTop();
      focusFirstInvalid();
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      await submitApplication({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        street: form.street.trim(),
        zip: form.zip.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        company: form.company.trim(),
        website: form.website.trim() || undefined,
        role: form.role || undefined,
        about: form.about.trim(),
        referral: form.referral.trim() || undefined,
      });
      setSubmitted(true);
      scrollToTop();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Antrag konnte nicht gesendet werden.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="dc-section" id="antrag">
      <div className="mw-apply">
        <div className="mw-apply-intro dc-reveal">
          <div className="dc-eyebrow">Antrag auf Aufnahme</div>
          <h2 className="dc-section-title">Erzähl uns,<br />wer du bist.</h2>
          <p>
            Je konkreter deine Angaben, desto eher können wir einschätzen, ob
            ein Platz im Kreis für beide Seiten Sinn ergibt.
          </p>
          <p>
            Alle Angaben werden vertraulich behandelt und verlassen den Kreis
            nicht.
          </p>
        </div>

        {!submitted ? (
          <form className="dc-form dc-reveal" data-delay="1" onSubmit={onSubmit} noValidate>
            <div className="mw-progress">
              <div className="mw-progress-meta">
                <span className="mw-step-active">{STEP_LABELS[step]}</span>
                <span className="mw-step-count">Schritt {step + 1} von {TOTAL}</span>
              </div>
              <div className="mw-progress-track" aria-hidden="true">
                {STEP_LABELS.map((_, i) => (
                  <span key={i} className="mw-progress-seg" data-state={i < step ? "done" : i === step ? "active" : "todo"} />
                ))}
              </div>
            </div>

            {step === 0 && (
              <div className="mw-form-group">
                <div className="dc-field-row">
                  <div className="dc-field" data-invalid={errors.name ? "true" : "false"}>
                    <label htmlFor="name">Name</label>
                    <input id="name" type="text" autoComplete="name" value={form.name} onChange={update("name")} placeholder="Vor- und Nachname" />
                    <span className="dc-field-error">{errors.name || ""}</span>
                  </div>
                  <div className="dc-field" data-invalid={errors.email ? "true" : "false"}>
                    <label htmlFor="email">E-Mail</label>
                    <input id="email" type="email" autoComplete="email" value={form.email} onChange={update("email")} placeholder="deine@adresse.at" />
                    <span className="dc-field-error">{errors.email || ""}</span>
                  </div>
                </div>
                <div className="dc-field" data-invalid={errors.phone ? "true" : "false"}>
                  <label htmlFor="phone">Telefon</label>
                  <input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={update("phone")} placeholder="+43 …" />
                  <span className="dc-field-error">{errors.phone || ""}</span>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="mw-form-group">
                <div className="dc-field" data-invalid={errors.street ? "true" : "false"}>
                  <label htmlFor="street">Straße &amp; Hausnummer</label>
                  <input id="street" type="text" autoComplete="address-line1" value={form.street} onChange={update("street")} placeholder="z. B. Wiespachstraße 12" />
                  <span className="dc-field-error">{errors.street || ""}</span>
                </div>
                <div className="dc-field-row dc-field-row--3">
                  <div className="dc-field" data-invalid={errors.zip ? "true" : "false"}>
                    <label htmlFor="zip">PLZ</label>
                    <input id="zip" type="text" autoComplete="postal-code" value={form.zip} onChange={update("zip")} placeholder="5400" />
                    <span className="dc-field-error">{errors.zip || ""}</span>
                  </div>
                  <div className="dc-field" data-invalid={errors.city ? "true" : "false"}>
                    <label htmlFor="city">Ort</label>
                    <input id="city" type="text" autoComplete="address-level2" value={form.city} onChange={update("city")} placeholder="Hallein" />
                    <span className="dc-field-error">{errors.city || ""}</span>
                  </div>
                  <div className="dc-field" data-invalid={errors.country ? "true" : "false"}>
                    <label htmlFor="country">Land</label>
                    <input id="country" type="text" autoComplete="country-name" value={form.country} onChange={update("country")} placeholder="Österreich" />
                    <span className="dc-field-error">{errors.country || ""}</span>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="mw-form-group">
                <div className="dc-field-row">
                  <div className="dc-field" data-invalid={errors.company ? "true" : "false"}>
                    <label htmlFor="company">Firmenname</label>
                    <input id="company" type="text" autoComplete="organization" value={form.company} onChange={update("company")} placeholder="Name des Unternehmens" />
                    <span className="dc-field-error">{errors.company || ""}</span>
                  </div>
                  <div className="dc-field">
                    <label htmlFor="website">Website <span style={{ textTransform: "none", color: "var(--color-ink-muted)" }}>(optional)</span></label>
                    <input id="website" type="url" autoComplete="url" value={form.website} onChange={update("website")} placeholder="www.beispiel.at" />
                    <span className="dc-field-error" />
                  </div>
                </div>
                <div className="dc-field" data-invalid={errors.role ? "true" : "false"}>
                  <label>Deine Rolle</label>
                  <div className="mw-role" role="group" aria-label="Deine Rolle im Unternehmen">
                    <button type="button" aria-pressed={form.role === "Inhaber"} onClick={() => setRole("Inhaber")}>Inhaber:in / Geschäftsführung</button>
                    <button type="button" aria-pressed={form.role === "Angestellt"} onClick={() => setRole("Angestellt")}>Angestellt</button>
                  </div>
                  <span className="dc-field-error">{errors.role || ""}</span>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="mw-form-group">
                <div className="dc-field" data-invalid={errors.about ? "true" : "false"}>
                  <label htmlFor="about">Vorstellung &amp; warum du zum Kreis passt</label>
                  <textarea id="about" value={form.about} onChange={update("about")} rows={6}
                    placeholder="Womit du unternehmerisch zu tun hast, was dich umtreibt — und warum du glaubst, dass du und der DealCircle zueinander passen." />
                  <span className="dc-field-error">{errors.about || ""}</span>
                </div>
                <div className="dc-field">
                  <label htmlFor="referral">Empfohlen von <span style={{ textTransform: "none", color: "var(--color-ink-muted)" }}>(optional)</span></label>
                  <input id="referral" type="text" value={form.referral} onChange={update("referral")} placeholder="Name des empfehlenden Mitglieds, falls vorhanden" />
                  <span className="dc-field-error" />
                </div>
                <p className="dc-micro" style={{ color: "var(--color-ink-muted)", margin: "2px 0 0", maxWidth: 440 }}>
                  Mit dem Absenden bestätigst du, dass deine Angaben vertraulich
                  behandelt werden. Details in der <a href="/datenschutz/">Datenschutzerklärung</a>.
                </p>
              </div>
            )}

            {serverError && <div className="dc-vip-error" role="alert">{serverError}</div>}

            <div className="mw-wizard-foot">
              {step > 0 ? (
                <button type="button" className="dc-btn dc-btn-secondary dc-btn--lg" onClick={goBack} disabled={submitting}>Zurück</button>
              ) : <span />}
              {step < TOTAL - 1 ? (
                <button type="button" className="dc-btn dc-btn-primary dc-btn--lg" onClick={goNext}>Weiter</button>
              ) : (
                <button type="submit" className="dc-btn dc-btn-primary dc-btn--lg" disabled={submitting}>
                  {submitting ? "Wird gesendet …" : "Antrag einreichen"}
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="dc-form-success dc-reveal">
            <span className="mw-status" aria-hidden="true">
              <span className="mw-status-dot" />Antrag in Prüfung
            </span>
            <div className="dc-form-success-check" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="dc-display-md" style={{ margin: 0, letterSpacing: "var(--tracking-display-md)" }}>Antrag eingereicht.</h3>
            <p className="dc-body" style={{ color: "var(--color-ink-muted)", margin: 0, maxWidth: 480 }}>
              Vielen Dank, {form.name.split(" ")[0]}. Dein Antrag ist bei uns
              eingegangen — wir prüfen ihn jetzt in Ruhe und sehen uns an, ob ein
              Platz im Kreis für beide Seiten passt. Wir melden uns innerhalb von
              zehn Tagen persönlich bei {form.email}. Bis dahin wird nichts berechnet.
            </p>
            <p className="dc-caption" style={{ color: "var(--color-ink-muted)", margin: "8px 0 0" }}>
              Substanz statt Show.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default function MitgliedWerdenPage() {
  return (
    <>
      <RevealManager />
      <Nav />
      <main>
        <Intro />
        <Antrag />
      </main>
      <Footer />
    </>
  );
}
