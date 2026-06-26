"use client";
import { useState } from "react";

type FormState = { name: string; email: string; phone: string; referral: string; message: string };
type Errors = Partial<Record<keyof FormState, string>>;

export default function Kontakt() {
  const [form, setForm] = useState<FormState>({ name: "", email: "", phone: "", referral: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  const update = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) {
      const next = { ...errors };
      delete next[field];
      setErrors(next);
    }
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!form.name.trim()) e.name = "Bitte deinen Namen angeben.";
    if (!form.email.trim()) e.email = "Bitte eine E-Mail-Adresse angeben.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Diese E-Mail-Adresse sieht nicht gültig aus.";
    if (!form.referral.trim()) e.referral = "Eine Empfehlung ist Voraussetzung für die Aufnahme.";
    if (!form.message.trim() || form.message.trim().length < 20) e.message = "Ein paar Sätze zu deiner Person helfen uns weiter (mind. 20 Zeichen).";
    return e;
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) setSubmitted(true);
  };

  return (
    <section className="dc-section" id="kontakt">
      <div className="dc-kontakt">
        <div className="dc-kontakt-intro dc-reveal">
          <div className="dc-eyebrow" style={{ marginBottom: "20px" }}>Kontakt &amp; Bewerbung</div>
          <h2 className="dc-section-title" style={{ marginBottom: "28px" }}>Schreib uns.</h2>
          <p>
            Zugang zum DealCircle erfolgt ausschließlich auf persönliche
            Empfehlung. Wenn du bereits über ein Mitglied von uns gehört hast,
            ist dieses Formular der richtige erste Schritt.
          </p>
          <p>
            Wir antworten innerhalb von zehn Tagen — persönlich, nicht
            automatisch.
          </p>

          <div className="dc-kontakt-meta">
            <span className="dc-eyebrow">Direkt</span>
            <span className="dc-kontakt-meta-line">salzburg@deal-circle.at</span>
            <span className="dc-kontakt-meta-line"><span>Schloss Wiespach · Hallein · Salzburger Land</span></span>
          </div>
        </div>

        {!submitted ? (
          <form className="dc-form dc-reveal" data-delay="1" onSubmit={onSubmit} noValidate>
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

            <div className="dc-field-row">
              <div className="dc-field">
                <label htmlFor="phone">Telefon <span style={{ textTransform: "none", color: "var(--color-ink-muted)" }}>(optional)</span></label>
                <input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={update("phone")} placeholder="+43 …" />
                <span className="dc-field-error"></span>
              </div>
              <div className="dc-field" data-invalid={errors.referral ? "true" : "false"}>
                <label htmlFor="referral">Empfohlen von</label>
                <input id="referral" type="text" value={form.referral} onChange={update("referral")} placeholder="Name des empfehlenden Mitglieds" />
                <span className="dc-field-error">{errors.referral || ""}</span>
              </div>
            </div>

            <div className="dc-field" data-invalid={errors.message ? "true" : "false"}>
              <label htmlFor="message">Kurze Vorstellung</label>
              <textarea
                id="message"
                value={form.message}
                onChange={update("message")}
                placeholder="Wer du bist, womit du unternehmerisch zu tun hast, und was dich an einem Austausch wie diesem interessiert."
                rows={5}
              />
              <span className="dc-field-error">{errors.message || ""}</span>
            </div>

            <div className="dc-form-footer">
              <p className="dc-micro">
                Mit dem Absenden bestätigst du, dass deine Angaben vertraulich
                behandelt werden. Details in der <a href="#datenschutz">Datenschutzerklärung</a>.
              </p>
              <button type="submit" className="dc-btn dc-btn-primary dc-btn--lg">Anfrage senden</button>
            </div>
          </form>
        ) : (
          <div className="dc-form-success dc-reveal">
            <div className="dc-form-success-check" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="dc-headline" style={{ margin: 0 }}>Vielen Dank, {form.name.split(" ")[0]}.</h3>
            <p className="dc-body" style={{ color: "var(--color-ink-muted)", margin: 0, maxWidth: "460px" }}>
              Deine Anfrage ist bei uns eingegangen. Wir melden uns innerhalb von
              zehn Tagen persönlich — voraussichtlich bei der Adresse {form.email}.
            </p>
            <p className="dc-caption" style={{ color: "var(--color-ink-muted)", margin: "8px 0 0" }}>
              Bis dahin: Substanz statt Show.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
