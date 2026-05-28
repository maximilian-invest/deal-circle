"use client";
import { useEffect, useState } from "react";
import type { UpcomingEvent } from "./types";

type Step = "review" | "paying" | "success";
type Method = "card" | "sepa" | "invoice";

type Props = {
  event: UpcomingEvent;
  onClose: () => void;
};

const METHODS: { id: Method; label: string; glyph: string }[] = [
  { id: "card",    label: "Karte",    glyph: "VISA" },
  { id: "sepa",    label: "SEPA",     glyph: "IBAN" },
  { id: "invoice", label: "Rechnung", glyph: "PDF" },
];

function Close({ onClose }: { onClose: () => void }) {
  return (
    <button type="button" className="mb-modal-close" onClick={onClose} aria-label="Schließen">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}

export default function EventModal({ event, onClose }: Props) {
  const [step, setStep] = useState<Step>("review");
  const [method, setMethod] = useState<Method>("card");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const fee = event.fee || 380;
  const total = fee;

  const pay = () => {
    setStep("paying");
    setTimeout(() => setStep("success"), 1400);
  };

  return (
    <div className="mb-modal-backdrop" onClick={onClose}>
      <div className="mb-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {step === "success" ? (
          <>
            <div className="mb-modal-header" style={{ paddingTop: 0 }}>
              <span />
              <Close onClose={onClose} />
            </div>
            <div className="mb-modal-success">
              <div className="mb-modal-success-check">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="mb-modal-title" style={{ margin: 0 }}>Anmeldung bestätigt.</h3>
              <p className="mb-modal-sub" style={{ maxWidth: 380 }}>
                Eine Bestätigung mit Kalendereintrag ist unterwegs zu Ihrer
                hinterlegten E-Mail-Adresse. Wir freuen uns auf Sie auf {event.location}.
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button type="button" className="dc-btn dc-btn-primary" onClick={onClose}>Schließen</button>
                <button type="button" className="dc-btn dc-btn-secondary" onClick={onClose}>Kalendereintrag laden</button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mb-modal-header">
              <div>
                <span className="mb-modal-eyebrow">Anmeldung & Beitrag</span>
                <h3 className="mb-modal-title">{event.title}</h3>
                <p className="mb-modal-sub" style={{ marginTop: 6 }}>
                  {event.day}. {event.monthLong} · {event.location} · {event.time}
                </p>
              </div>
              <Close onClose={onClose} />
            </div>

            <div className="mb-modal-body">
              <div className="mb-modal-summary">
                <div className="mb-modal-summary-row">
                  <span>Teilnahmebeitrag</span>
                  <span>€ {fee.toLocaleString("de-AT")}.00</span>
                </div>
                <div className="mb-modal-summary-row">
                  <span>Catering & Location</span>
                  <span>inkludiert</span>
                </div>
                <div className="mb-modal-summary-row">
                  <span>Mwst. 20%</span>
                  <span>im Beitrag enthalten</span>
                </div>
                <div className="mb-modal-summary-row mb-modal-summary-row--total">
                  <span>Gesamt</span>
                  <span>€ {total.toLocaleString("de-AT")}.00</span>
                </div>
              </div>

              <div>
                <span className="mb-modal-eyebrow" style={{ textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 10 }}>
                  Zahlungsart
                </span>
                <div className="mb-pay-methods">
                  {METHODS.map((m) => (
                    <div
                      key={m.id}
                      className="mb-pay-method"
                      data-selected={method === m.id ? "true" : "false"}
                      onClick={() => setMethod(m.id)}
                    >
                      <span className="mb-pay-method-glyph">{m.glyph}</span>
                      <span className="mb-pay-method-label">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-modal-foot">
              <span className="mb-modal-foot-note">
                Bei Absage bis 14 Tage vor dem Treffen erstatten wir den vollen Beitrag.
              </span>
              <button
                type="button"
                className="dc-btn dc-btn-primary dc-btn--lg"
                onClick={pay}
                disabled={step === "paying"}
              >
                {step === "paying" ? "Verarbeitung …" : `Anmelden & € ${total.toLocaleString("de-AT")}.00 bezahlen`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
