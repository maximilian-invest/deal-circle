# DealCircle API

Node.js + Express + SQLite Backend für Auth und Mitglieder-Verwaltung.

## Endpoints

### Auth (öffentlich)
- `POST /api/auth/login` — `{ email, password }` → `{ token, user }`
- `GET  /api/auth/me` — _Authorization: Bearer …_ → `{ user }`
- `POST /api/auth/logout` — clientseitig (Token verwerfen)

### Admin (nur Rolle `admin`)
- `GET    /api/admin/users` — alle Mitglieder
- `POST   /api/admin/users` — `{ email, name, password, role? }` → neues Mitglied
- `PATCH  /api/admin/users/:id` — `{ name?, password?, role? }` → ändern
- `DELETE /api/admin/users/:id` — löschen (nicht sich selbst, nicht letzter admin)

### Health
- `GET /healthz` — `{ ok: true }`

## Env-Variablen (`/etc/dealcircle-api.env`)

```
DC_PORT=3001
DC_HOST=127.0.0.1
DC_DB_PATH=/var/lib/dealcircle-api/db.sqlite
DC_ADMIN_EMAIL=max@deal-circle.at
DC_ADMIN_PASSWORD=55default
DC_ADMIN_NAME=Maximilian
DC_JWT_SECRET=<64+ hex chars — `openssl rand -hex 48`>
DC_JWT_TTL=7d
DC_CORS_ORIGIN=https://deal-circle.at
```

## Deploy

Siehe `deal-circle/deploy.sh` — Backend wird automatisch nach `/opt/dealcircle-api/`
kopiert, dependencies installiert, systemd-Unit registriert.

## Lokal entwickeln

```bash
cd deal-circle/api
npm install
DC_DB_PATH=./data/db.sqlite \
DC_ADMIN_PASSWORD=55default \
DC_JWT_SECRET=$(openssl rand -hex 48) \
  npm start
```
