"use client";
import { useEffect, useState } from "react";
import {
  changePassword, fetchProfile, updateProfile, type Profile as ProfileT,
} from "./auth";

export default function Profile() {
  const [profile, setProfile] = useState<ProfileT | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number>(0);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwNew2, setPwNew2] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwOk, setPwOk] = useState(false);

  useEffect(() => {
    fetchProfile()
      .then((p) => {
        setProfile(p);
        setName(p.name);
        setPhone(p.phone ?? "");
        setCompany(p.company ?? "");
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Profil nicht ladbar."));
  }, []);

  const onSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true); setSaveError(null);
    try {
      const updated = await updateProfile({
        name: name.trim(),
        phone: phone.trim() || null,
        company: company.trim() || null,
      });
      setProfile(updated);
      setSavedAt(Date.now());
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  };

  const onChangePw = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPwError(null); setPwOk(false);
    if (pwNew.length < 8) { setPwError("Mindestens 8 Zeichen."); return; }
    if (pwNew !== pwNew2) { setPwError("Die zwei Passwörter stimmen nicht überein."); return; }
    setPwBusy(true);
    try {
      await changePassword(pwCurrent, pwNew);
      setPwOk(true);
      setPwCurrent(""); setPwNew(""); setPwNew2("");
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Passwort-Änderung fehlgeschlagen.");
    } finally {
      setPwBusy(false);
    }
  };

  if (loadError) return <div className="mb-admin-alert mb-admin-alert--error">{loadError}</div>;
  if (!profile)  return <div className="mb-admin-empty">Profil wird geladen …</div>;

  return (
    <div className="mb-admin">
      <section className="mb-admin-card">
        <header className="mb-admin-card-head">
          <div>
            <span className="mb-admin-eyebrow">Mein Profil</span>
            <h3 className="mb-admin-card-title">Stammdaten</h3>
          </div>
        </header>

        <form className="mb-admin-form" onSubmit={onSave} noValidate>
          <div className="dc-field">
            <label>E-Mail</label>
            <input type="email" value={profile.email} disabled readOnly />
            <span className="mb-admin-foot-note" style={{ marginTop: 4 }}>
              E-Mail nicht änderbar — bitte Admin kontaktieren.
            </span>
          </div>
          <div className="dc-field">
            <label htmlFor="p-name">Name</label>
            <input id="p-name" type="text" value={name}
              onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="mb-admin-form-row">
            <div className="dc-field">
              <label htmlFor="p-phone">Telefonnummer</label>
              <input id="p-phone" type="tel" autoComplete="tel" value={phone}
                onChange={(e) => setPhone(e.target.value)} placeholder="+43 …" />
            </div>
            <div className="dc-field">
              <label htmlFor="p-company">Unternehmen</label>
              <input id="p-company" type="text" autoComplete="organization" value={company}
                onChange={(e) => setCompany(e.target.value)} placeholder="Firma GmbH" />
            </div>
          </div>

          {saveError && <div className="mb-admin-alert mb-admin-alert--error">{saveError}</div>}
          {savedAt > 0 && !saveError && (
            <div className="mb-admin-alert mb-admin-alert--ok">Gespeichert.</div>
          )}

          <div className="mb-admin-form-foot">
            <span className="mb-admin-foot-note">
              Eingeloggt als {profile.role === "admin" ? "Administrator" : "Mitglied"}
              {profile.last_login_at && ` · Letzter Login: ${profile.last_login_at}`}
            </span>
            <button type="submit" className="dc-btn dc-btn-primary" disabled={saving}>
              {saving ? "Speichern …" : "Profil speichern"}
            </button>
          </div>
        </form>
      </section>

      <section className="mb-admin-card">
        <header className="mb-admin-card-head">
          <div>
            <span className="mb-admin-eyebrow">Sicherheit</span>
            <h3 className="mb-admin-card-title">Passwort ändern</h3>
          </div>
        </header>

        <form className="mb-admin-form" onSubmit={onChangePw} noValidate>
          <div className="dc-field">
            <label htmlFor="pw-cur">Aktuelles Passwort</label>
            <input id="pw-cur" type="password" autoComplete="current-password"
              value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} required />
          </div>
          <div className="mb-admin-form-row">
            <div className="dc-field">
              <label htmlFor="pw-new">Neues Passwort</label>
              <input id="pw-new" type="password" autoComplete="new-password"
                value={pwNew} onChange={(e) => setPwNew(e.target.value)}
                placeholder="mind. 8 Zeichen" minLength={8} required />
            </div>
            <div className="dc-field">
              <label htmlFor="pw-new2">Wiederholen</label>
              <input id="pw-new2" type="password" autoComplete="new-password"
                value={pwNew2} onChange={(e) => setPwNew2(e.target.value)}
                minLength={8} required />
            </div>
          </div>

          {pwError && <div className="mb-admin-alert mb-admin-alert--error">{pwError}</div>}
          {pwOk && <div className="mb-admin-alert mb-admin-alert--ok">Passwort aktualisiert.</div>}

          <div className="mb-admin-form-foot">
            <span className="mb-admin-foot-note">
              Vergessen? <a href="/mitglieder/passwort-zuruecksetzen/">Reset-Link per E-Mail</a>
            </span>
            <button type="submit" className="dc-btn dc-btn-primary" disabled={pwBusy}>
              {pwBusy ? "Speichern …" : "Passwort ändern"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
