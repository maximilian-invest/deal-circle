"use client";
import { useEffect, useState } from "react";
import { createUser, deleteUser, listUsers, updateUser, type AdminUser } from "./admin";
import type { Role } from "./auth";

type CreateForm = { email: string; name: string; password: string; role: Role };

const EMPTY_FORM: CreateForm = { email: "", name: "", password: "", role: "member" };

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("de-AT", { day: "2-digit", month: "short", year: "numeric" });
}

type Props = { currentUserEmail: string };

export default function MembersAdmin({ currentUserEmail }: Props) {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdNotice, setCreatedNotice] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<number | null>(null);

  const reload = async () => {
    try {
      setLoadError(null);
      const list = await listUsers();
      setUsers(list);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Konnte Mitglieder nicht laden.");
    }
  };

  useEffect(() => { reload(); }, []);

  const onCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateError(null);
    setCreatedNotice(null);

    if (!form.email.trim() || !form.name.trim() || form.password.length < 8) {
      setCreateError("Bitte E-Mail, Name und ein Passwort mit mindestens 8 Zeichen angeben.");
      return;
    }

    setCreating(true);
    try {
      const created = await createUser({
        email: form.email.trim(),
        name: form.name.trim(),
        password: form.password,
        role: form.role,
      });
      setCreatedNotice(`Mitglied ${created.email} angelegt — Passwort jetzt sicher an die Person übermitteln.`);
      setForm(EMPTY_FORM);
      await reload();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Anlegen fehlgeschlagen.");
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async (u: AdminUser) => {
    if (!confirm(`${u.email} wirklich entfernen?`)) return;
    setBusyId(u.id);
    try {
      await deleteUser(u.id);
      await reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Löschen fehlgeschlagen.");
    } finally {
      setBusyId(null);
    }
  };

  const onToggleRole = async (u: AdminUser) => {
    const newRole: Role = u.role === "admin" ? "member" : "admin";
    if (!confirm(`Rolle von ${u.email} auf ${newRole === "admin" ? "Administrator" : "Mitglied"} ändern?`)) return;
    setBusyId(u.id);
    try {
      await updateUser(u.id, { role: newRole });
      await reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Aktualisieren fehlgeschlagen.");
    } finally {
      setBusyId(null);
    }
  };

  const onResetPassword = async (u: AdminUser) => {
    const pwd = window.prompt(`Neues Passwort für ${u.email}? (mind. 8 Zeichen)`);
    if (!pwd) return;
    if (pwd.length < 8) {
      alert("Mindestens 8 Zeichen.");
      return;
    }
    setBusyId(u.id);
    try {
      await updateUser(u.id, { password: pwd });
      alert(`Passwort für ${u.email} aktualisiert. Bitte sicher übermitteln.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Passwort-Reset fehlgeschlagen.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mb-admin">
      <section className="mb-admin-card">
        <header className="mb-admin-card-head">
          <div>
            <span className="mb-admin-eyebrow">Neues Mitglied anlegen</span>
            <h3 className="mb-admin-card-title">Mitglied einladen</h3>
          </div>
        </header>

        <form className="mb-admin-form" onSubmit={onCreate} noValidate>
          <div className="mb-admin-form-row">
            <div className="dc-field">
              <label htmlFor="m-email">E-Mail</label>
              <input
                id="m-email"
                type="email"
                autoComplete="off"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="vorname.nachname@firma.at"
                required
              />
            </div>
            <div className="dc-field">
              <label htmlFor="m-name">Name</label>
              <input
                id="m-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Vor- und Nachname"
                required
              />
            </div>
          </div>
          <div className="mb-admin-form-row">
            <div className="dc-field">
              <label htmlFor="m-password">Initial-Passwort</label>
              <input
                id="m-password"
                type="text"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="mind. 8 Zeichen"
                required
              />
            </div>
            <div className="dc-field">
              <label htmlFor="m-role">Rolle</label>
              <select
                id="m-role"
                className="mb-admin-select"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              >
                <option value="member">Mitglied</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          {createError && <div className="mb-admin-alert mb-admin-alert--error">{createError}</div>}
          {createdNotice && <div className="mb-admin-alert mb-admin-alert--ok">{createdNotice}</div>}

          <div className="mb-admin-form-foot">
            <span className="mb-admin-foot-note">
              Initial-Passwort wird gehashed gespeichert. Es ist nach dem Anlegen nicht mehr einsehbar — bitte vorher notieren.
            </span>
            <button type="submit" className="dc-btn dc-btn-primary" disabled={creating}>
              {creating ? "Wird angelegt …" : "Mitglied anlegen"}
            </button>
          </div>
        </form>
      </section>

      <section className="mb-admin-card">
        <header className="mb-admin-card-head">
          <div>
            <span className="mb-admin-eyebrow">Mitgliederliste</span>
            <h3 className="mb-admin-card-title">
              Alle Accounts {users ? `(${users.length})` : ""}
            </h3>
          </div>
          <button
            type="button"
            className="dc-btn dc-btn-secondary"
            onClick={reload}
            disabled={users === null && !loadError}
          >
            Aktualisieren
          </button>
        </header>

        {loadError && <div className="mb-admin-alert mb-admin-alert--error">{loadError}</div>}

        {users === null && !loadError && (
          <div className="mb-admin-empty">Wird geladen …</div>
        )}

        {users && users.length === 0 && (
          <div className="mb-admin-empty">Noch keine Mitglieder.</div>
        )}

        {users && users.length > 0 && (
          <div className="mb-admin-table-wrap">
            <table className="mb-admin-table">
              <thead>
                <tr>
                  <th>E-Mail</th>
                  <th>Name</th>
                  <th>Rolle</th>
                  <th>Angelegt</th>
                  <th>Letzter Login</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const self = u.email.toLowerCase() === currentUserEmail.toLowerCase();
                  const busy = busyId === u.id;
                  return (
                    <tr key={u.id}>
                      <td>
                        <span className="mb-admin-email">{u.email}</span>
                        {self && <span className="mb-admin-self">(Sie)</span>}
                      </td>
                      <td>{u.name}</td>
                      <td>
                        <span className={`mb-admin-role mb-admin-role--${u.role}`}>
                          {u.role === "admin" ? "Administrator" : "Mitglied"}
                        </span>
                      </td>
                      <td>{fmtDate(u.created_at)}</td>
                      <td>{fmtDate(u.last_login_at)}</td>
                      <td>
                        <div className="mb-admin-actions">
                          <button
                            type="button"
                            className="mb-admin-action"
                            onClick={() => onResetPassword(u)}
                            disabled={busy}
                            title="Passwort zurücksetzen"
                          >
                            Passwort
                          </button>
                          <button
                            type="button"
                            className="mb-admin-action"
                            onClick={() => onToggleRole(u)}
                            disabled={busy || self}
                            title={u.role === "admin" ? "Zu Mitglied machen" : "Zum Administrator machen"}
                          >
                            {u.role === "admin" ? "→ Mitglied" : "→ Admin"}
                          </button>
                          <button
                            type="button"
                            className="mb-admin-action mb-admin-action--danger"
                            onClick={() => onDelete(u)}
                            disabled={busy || self}
                            title="Account löschen"
                          >
                            Löschen
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mb-admin-footnote">
        Hinweis: Passwörter werden mit bcrypt (cost 11) gespeichert. Initial-Passwörter
        und Reset-Passwörter werden im Klartext nur einmal angezeigt — bitte sicher
        an das Mitglied übermitteln. Self-Service-Reset (per E-Mail-Link) folgt im
        nächsten Schritt.
      </p>
    </div>
  );
}
