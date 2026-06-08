# Deal Circle Salzburg

Private Networking-Plattform — Landingpage, Mitgliederbereich und Admin-Backend
für den Deal Circle Salzburg. Treffen alle zwei Monate auf Schloss Wiespach,
zwei größere Events pro Jahr, Zugang auf persönliche Empfehlung.

Live: <https://deal-circle.at>

## Architektur

```
deal-circle/
├── site/                       Next.js 15 Static-Export (Frontend)
│   ├── app/                    App Router (Landingpage + /mitglieder/*)
│   ├── components/             React-Komponenten (Hero, Eindrücke, Sidebar, …)
│   └── public/                 Assets (Logo, Fotos)
│
├── api/                        Node.js + Express + SQLite (Backend)
│   ├── server.js               Entry-Point
│   ├── db.js                   SQLite-Init + Bootstrap (Admin + Sample-Events)
│   ├── routes/
│   │   ├── auth.js             POST /login, GET /me
│   │   ├── admin.js            User-CRUD (admin-only)
│   │   ├── admin-events.js     Event-CRUD (admin-only)
│   │   └── events.js           GET /events (auth) + GET /events/public/next (public)
│   ├── middleware/auth.js      JWT-Verifikation
│   ├── systemd/                systemd-Unit für VPS
│   └── nginx/                  Reverse-Proxy-Snippet
│
├── deploy-server.sh            One-Shot Deploy (auf VPS ausführen)
└── deploy.sh                   Legacy: nur Frontend rsync via SSH (lokal)
```

**Frontend** wird statisch exportiert (`output: "export"`), nginx serviert es
unter `/`. **Backend** läuft als systemd-Service auf `127.0.0.1:3001`, nginx
proxied `/api/` darauf.

## Endpoints

| Route | Auth | Was |
|-------|------|-----|
| `GET  /api/auth/me`           | Bearer | aktueller User |
| `POST /api/auth/login`        | – | E-Mail+Passwort → JWT (HS256, 7d) |
| `POST /api/auth/logout`       | – | clientseitig (Token verwerfen) |
| `GET  /api/events`            | Bearer | alle Events |
| `GET  /api/events/public/next`| – | nächstes upcoming Event (safe fields) |
| `GET    /api/admin/users`     | admin | Mitglieder-Liste |
| `POST   /api/admin/users`     | admin | Mitglied anlegen |
| `PATCH  /api/admin/users/:id` | admin | Name / Passwort / Rolle ändern |
| `DELETE /api/admin/users/:id` | admin | löschen (Self-Delete + Last-Admin geschützt) |
| `POST   /api/admin/events`    | admin | Event anlegen |
| `PATCH  /api/admin/events/:id`| admin | Event ändern |
| `DELETE /api/admin/events/:id`| admin | Event löschen |
| `GET /healthz`                | – | `{ ok: true }` |

## Deploy

Auf dem VPS (root@srhomes-vps) reinkopieren:

```bash
TMP=$(mktemp -d) && cd "$TMP" && \
git clone --depth=1 https://github.com/maximilian-invest/deal-circle.git src && \
bash src/deploy-server.sh
```

Das Skript installiert/aktualisiert Backend nach `/opt/dealcircle-api/`, baut
das Frontend, rsynct nach `/var/www/deal-circle/`, registriert die systemd-Unit,
hängt den `/api/`-Reverse-Proxy in nginx (idempotent) und führt Smoke-Tests
durch.

**Erstdeploy:** das Skript erzeugt `/etc/dealcircle-api.env` mit zufälligem
JWT-Secret und legt den Admin `max@deal-circle.at / 55default` an. **Bitte das
Default-Passwort sofort nach dem ersten Login im Admin-Tab "Mitglieder
verwalten" ändern.**

## Lokale Entwicklung

### Frontend
```bash
cd site
npm install
npm run dev          # http://localhost:3000
```

Frontend ruft `/api/...` relativ auf. Für lokale Entwicklung mit Backend
zusätzlich `NEXT_PUBLIC_API_BASE=http://localhost:3001/api` in `.env.local`.

### Backend
```bash
cd api
npm install
DC_DB_PATH=./data/db.sqlite \
DC_JWT_SECRET=$(openssl rand -hex 48) \
DC_PORT=3001 \
  npm start
```

Beim ersten Lauf wird der Admin angelegt und 6 Beispiel-Events befüllt.

## Backup

DB ist eine einzige Datei — Backup = `cp`:

```bash
cp /var/lib/dealcircle-api/db.sqlite ~/db-$(date +%F).sqlite
```

## Logs

```bash
journalctl -u dealcircle-api -f      # Backend
journalctl -u nginx -f               # nginx Access/Error
```
