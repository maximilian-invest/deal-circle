#!/usr/bin/env bash
# =============================================================================
#  Deal Circle — Server-Side Deploy (auf root@srhomes-vps ausführen)
#
#  Was passiert:
#    1. Git clone des Branch in temp dir
#    2. Frontend bauen (Next.js static export) → rsync nach /var/www/deal-circle
#    3. Backend installieren nach /opt/dealcircle-api (Node.js + SQLite)
#    4. systemd-Unit setzen + Service starten
#    5. nginx /api/-Reverse-Proxy einrichten (idempotent)
#    6. Smoke-Tests
#
#  Verwendung:
#      bash <(curl -sL https://raw.githubusercontent.com/.../deploy-server.sh)
#      ODER
#      git clone … && bash deploy-server.sh
#
#  Voraussetzungen: Node.js 20+, nginx, rsync, git, openssl
# =============================================================================
set -euo pipefail

BRANCH="${BRANCH:-main}"
REPO_URL="${REPO_URL:-https://github.com/maximilian-invest/deal-circle.git}"

WEB_DIR="/var/www/deal-circle"
API_DIR="/opt/dealcircle-api"
API_DATA_DIR="/var/lib/dealcircle-api"
API_ENV_FILE="/etc/dealcircle-api.env"
API_USER="dealcircle"
NGINX_SITE="/etc/nginx/sites-enabled/deal-circle.at"
NGINX_SITE_AVAIL="/etc/nginx/sites-available/deal-circle.at"

step() { printf "\n\033[1;36m→ %s\033[0m\n" "$*"; }
ok()   { printf "  \033[1;32m✓\033[0m %s\n" "$*"; }
warn() { printf "  \033[1;33m⚠\033[0m %s\n" "$*"; }
die()  { printf "\n\033[1;31m✗ %s\033[0m\n" "$*" >&2; exit 1; }

[ "$EUID" -eq 0 ] || die "Bitte als root ausführen."

# ---------- Sources holen ----------
step "Repo klonen ($BRANCH)"
TMP=$(mktemp -d)
trap "rm -rf $TMP" EXIT
git clone --depth=1 -b "$BRANCH" "$REPO_URL" "$TMP/src" >/dev/null 2>&1 \
  || die "git clone fehlgeschlagen"
ok "geklont nach $TMP/src"

# ---------- Backend-User anlegen ----------
step "API-User '$API_USER' sicherstellen"
if ! id "$API_USER" >/dev/null 2>&1; then
  useradd --system --home-dir "$API_DIR" --shell /usr/sbin/nologin "$API_USER"
  ok "User '$API_USER' angelegt"
else
  ok "User '$API_USER' existiert"
fi

# ---------- Backend installieren ----------
step "Backend → $API_DIR"
mkdir -p "$API_DIR"
rsync -a --delete \
  --exclude 'node_modules' \
  --exclude 'data' \
  "$TMP/src/api/" "$API_DIR/"

step "Backend-Dependencies (npm ci)"
( cd "$API_DIR" && npm install --omit=dev --no-audit --no-fund --loglevel=warn ) \
  >/dev/null 2>&1 || die "npm install fehlgeschlagen"
ok "Dependencies installiert"

# Daten-Verzeichnis für SQLite
mkdir -p "$API_DATA_DIR"
chown -R "$API_USER":"$API_USER" "$API_DATA_DIR"
chown -R "$API_USER":"$API_USER" "$API_DIR"

# ---------- Env-File ----------
step "Env-File $API_ENV_FILE sicherstellen"
if [ ! -f "$API_ENV_FILE" ]; then
  JWT_SECRET=$(openssl rand -hex 48)
  cat > "$API_ENV_FILE" <<EOF
# DealCircle API — Production
DC_PORT=3001
DC_HOST=127.0.0.1
DC_DB_PATH=$API_DATA_DIR/db.sqlite
DC_ADMIN_EMAIL=max@deal-circle.at
DC_ADMIN_PASSWORD=55default
DC_ADMIN_NAME=Maximilian
DC_JWT_SECRET=$JWT_SECRET
DC_JWT_TTL=7d
DC_CORS_ORIGIN=https://deal-circle.at

# SMTP fuer VIP-Signup-Mails + Event-Bestaetigungen
# (Bitte Passwort regelmaessig rotieren — niemals in Repo committen.)
DC_SMTP_HOST=smtp.world4you.com
DC_SMTP_PORT=587
DC_SMTP_USER=event@deal-circle.at
DC_SMTP_PASS=BITTE_HIER_DAS_SMTP_PASSWORT_EINTRAGEN
DC_SMTP_FROM=event@deal-circle.at
DC_SMTP_FROM_NAME=DealCircle Salzburg
DC_NOTIFY_TO=event@deal-circle.at
EOF
  chmod 640 "$API_ENV_FILE"
  chown root:"$API_USER" "$API_ENV_FILE"
  ok "Env-File neu angelegt mit zufaelligem JWT-Secret"
  warn "DC_ADMIN_PASSWORD steht in $API_ENV_FILE — nach erstem Login aendern oder via Admin-UI rotieren"
else
  ok "Env-File existiert (unveraendert)"
fi

# ---------- systemd ----------
step "systemd-Unit dealcircle-api.service"
install -m 0644 "$API_DIR/systemd/dealcircle-api.service" /etc/systemd/system/dealcircle-api.service
systemctl daemon-reload
systemctl enable --now dealcircle-api.service >/dev/null 2>&1
systemctl restart dealcircle-api.service
sleep 1.5
if systemctl is-active --quiet dealcircle-api.service; then
  ok "Service laeuft"
else
  systemctl status dealcircle-api.service --no-pager -l | tail -20
  die "Service startet nicht"
fi

# Backend-Healthcheck
if curl -sf http://127.0.0.1:3001/healthz >/dev/null; then
  ok "Backend antwortet auf /healthz"
else
  die "Backend antwortet nicht — journalctl -u dealcircle-api -n 50 pruefen"
fi

# ---------- Frontend bauen + deployen ----------
step "Frontend bauen (Next.js Static Export)"
( cd "$TMP/src/site" \
  && npm install --no-audit --no-fund --loglevel=warn >/dev/null 2>&1 \
  && npm run build >/dev/null 2>&1 ) \
  || die "Frontend-Build fehlgeschlagen"
ok "Build OK"

step "Backup + Frontend → $WEB_DIR"
TS=$(date +%s)
if [ -d "$WEB_DIR" ]; then
  cp -a "$WEB_DIR" "${WEB_DIR}.bak.$TS"
  ok "Backup: ${WEB_DIR}.bak.$TS"
fi
mkdir -p "$WEB_DIR"
rsync -a --delete --exclude '.well-known/' \
  "$TMP/src/site/out/" "$WEB_DIR/"
chown -R www-data:www-data "$WEB_DIR"
ok "Static-Files synchronisiert"

# ---------- nginx /api/-Block ----------
step "nginx: /api/-Reverse-Proxy idempotent setzen"
if [ ! -f "$NGINX_SITE" ] && [ ! -f "$NGINX_SITE_AVAIL" ]; then
  warn "kein nginx-Site fuer deal-circle.at gefunden — ueberspringe automatische /api/-Konfiguration"
  warn "bitte manuell folgenden Block in den server { ... }-Block einfuegen:"
  echo "---"
  cat "$API_DIR/nginx/deal-circle.conf.snippet"
  echo "---"
else
  CONF_FILE="$NGINX_SITE_AVAIL"
  [ -f "$NGINX_SITE_AVAIL" ] || CONF_FILE="$NGINX_SITE"

  if grep -q "location /api/" "$CONF_FILE"; then
    ok "nginx-Site enthaelt bereits location /api/"
  else
    cp "$CONF_FILE" "${CONF_FILE}.bak.$TS"
    # Vor dem ersten 'location /' den /api/-Block einfuegen
    awk -v snippet="$API_DIR/nginx/deal-circle.conf.snippet" '
      BEGIN { inserted = 0 }
      /^\s*location \/ \{/ && !inserted {
        while ((getline line < snippet) > 0) print line
        print ""
        inserted = 1
      }
      { print }
    ' "$CONF_FILE" > "${CONF_FILE}.new"
    mv "${CONF_FILE}.new" "$CONF_FILE"
    ok "nginx-Site erweitert (Backup: ${CONF_FILE}.bak.$TS)"
  fi
fi

# ---------- nginx: Upload-Limit fuer bestehende Installs anheben ----------
# Aeltere Sites hatten im /api/-Block 'client_max_body_size 64k;' — das blockt
# Bild-Uploads (Speaker-/Titelbilder) mit HTTP 413, bevor sie die API erreichen.
# Da der /api/-Block bei Bestands-Installs NICHT neu eingefuegt wird (siehe oben),
# heben wir das Limit hier idempotent auf 10m an.
step "nginx: Upload-Limit (client_max_body_size) sicherstellen"
if [ -f "$NGINX_SITE_AVAIL" ] || [ -f "$NGINX_SITE" ]; then
  CMBS_FILE="$NGINX_SITE_AVAIL"
  [ -f "$NGINX_SITE_AVAIL" ] || CMBS_FILE="$NGINX_SITE"
  if grep -qE "client_max_body_size[[:space:]]+64k;" "$CMBS_FILE"; then
    cp "$CMBS_FILE" "${CMBS_FILE}.bak.cmbs.$TS"
    sed -i -E "s/client_max_body_size[[:space:]]+64k;/client_max_body_size  10m;/g" "$CMBS_FILE"
    ok "client_max_body_size 64k → 10m angehoben (Backup: ${CMBS_FILE}.bak.cmbs.$TS)"
  else
    ok "client_max_body_size bereits ausreichend (kein 64k gefunden)"
  fi
else
  warn "kein nginx-Site gefunden — Upload-Limit nicht geprueft"
fi

step "nginx konfig pruefen + reload"
nginx -t 2>&1 | tail -3
systemctl reload nginx
ok "nginx reloaded"

# ---------- Smoke-Tests ----------
step "Smoke-Tests"
echo
printf "  %-30s %s\n" "Home:"             "$(curl -sI -o /dev/null -w 'HTTP %{http_code}' https://deal-circle.at/)"
printf "  %-30s %s\n" "Login-Seite:"      "$(curl -sI -o /dev/null -w 'HTTP %{http_code}' https://deal-circle.at/mitglieder/login/)"
printf "  %-30s %s\n" "Dashboard-Seite:"  "$(curl -sI -o /dev/null -w 'HTTP %{http_code}' https://deal-circle.at/mitglieder/dashboard/)"
printf "  %-30s %s\n" "API healthz:"      "$(curl -sI -o /dev/null -w 'HTTP %{http_code}' https://deal-circle.at/api/../healthz 2>/dev/null || echo "n/a (direkt: $(curl -sI -o /dev/null -w '%{http_code}' http://127.0.0.1:3001/healthz))")"

# Admin-Login-Test
LOGIN_OUT=$(curl -s -w '\nHTTP_%{http_code}\n' -X POST -H "Content-Type: application/json" \
  -d '{"email":"max@deal-circle.at","password":"55default"}' \
  https://deal-circle.at/api/auth/login 2>/dev/null || echo "FAIL")
if echo "$LOGIN_OUT" | grep -q '"token"'; then
  ok "Admin-Login funktioniert (max@deal-circle.at / 55default)"
else
  warn "Admin-Login Test fehlgeschlagen — Output:"
  echo "$LOGIN_OUT" | sed 's/^/    /'
fi

echo
echo "==========================================="
echo "  ✓ Deploy fertig — https://deal-circle.at/"
echo "==========================================="
echo
echo "  Admin-Login:"
echo "    URL: https://deal-circle.at/mitglieder/login/"
echo "    Mail: max@deal-circle.at"
echo "    Passwort: 55default"
echo
echo "  Backend-Logs:  journalctl -u dealcircle-api -f"
echo "  Backend-Stop:  systemctl stop dealcircle-api"
echo "  DB-Backup:     cp $API_DATA_DIR/db.sqlite ~/db-backup-\$(date +%s).sqlite"
echo
