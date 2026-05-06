#!/usr/bin/env bash
# ============================================================================
#  Deal Circle — Deploy zu deal-circle.at
#  Verwendung (lokal auf deinem Rechner, mit deinem SSH-Key):
#      bash deal-circle/deploy.sh           # interaktiv (mit Bestätigung)
#      bash deal-circle/deploy.sh --yes     # ohne Rückfrage
#      bash deal-circle/deploy.sh --dry-run # nur zeigen, nichts pushen
# ============================================================================
set -euo pipefail

# --- Konfiguration -----------------------------------------------------------
HOST="srhomes-vps"
TARGET="/var/www/deal-circle"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SITE_DIR="$SCRIPT_DIR/site"

# --- Argumente ---------------------------------------------------------------
YES=0
DRY=0
for arg in "$@"; do
  case "$arg" in
    --yes|-y) YES=1 ;;
    --dry-run|-n) DRY=1 ;;
    -h|--help)
      sed -n '2,8p' "${BASH_SOURCE[0]}"
      exit 0 ;;
  esac
done

# --- Validierung -------------------------------------------------------------
[[ -d "$SITE_DIR" ]]        || { echo "FEHLER: $SITE_DIR fehlt"; exit 1; }
[[ -d "$SITE_DIR/brand" ]]  || { echo "FEHLER: $SITE_DIR/brand fehlt"; exit 1; }
command -v rsync >/dev/null || { echo "FEHLER: rsync nicht installiert"; exit 1; }
command -v ssh   >/dev/null || { echo "FEHLER: ssh nicht installiert";   exit 1; }

# --- Banner ------------------------------------------------------------------
cat <<EOF

  ╔════════════════════════════════════════════════════════════════╗
  ║   Deal Circle — Release 03 Deploy                              ║
  ║   Quelle: $SITE_DIR
  ║   Ziel:   $HOST:$TARGET
  ╚════════════════════════════════════════════════════════════════╝

  Wird hochgeladen:
    - index.html, styles.css, script.js
    - brand/ (Logos, tokens, CD-Doc, preview.html)

  Bleibt unangetastet (am Server):
    - assets/properties/*  (deine Bildergalerie)
    - .well-known/*        (Let's-Encrypt ACME)
    - alles, was nicht im lokalen Quellordner ist

  Vor dem Push wird automatisch ein Backup erstellt:
    /var/www/deal-circle.bak.<unix-timestamp>

EOF

# --- SSH-Test ----------------------------------------------------------------
echo "→ Teste SSH-Verbindung zu '$HOST' …"
if ! ssh -o BatchMode=yes -o ConnectTimeout=8 "$HOST" "echo ok" >/dev/null 2>&1; then
  cat <<EOF

  FEHLER: SSH zu '$HOST' funktioniert nicht.
  Prüfe:
    - ~/.ssh/config Eintrag für '$HOST'
    - SSH-Key geladen (ssh-add -l)
    - Netzwerk / VPN
    - Test direkt: ssh $HOST 'echo ok'

EOF
  exit 2
fi
echo "  ✓ SSH OK"

# --- Bestätigung -------------------------------------------------------------
if [[ $YES -eq 0 && $DRY -eq 0 ]]; then
  read -rp $'\n  Fortfahren? (j/N) ' ans
  [[ "$ans" =~ ^[jJyY]$ ]] || { echo "  Abgebrochen."; exit 0; }
fi

# --- Backup am Server --------------------------------------------------------
if [[ $DRY -eq 0 ]]; then
  TS=$(date +%s)
  echo "→ Erstelle Backup: $TARGET.bak.$TS"
  ssh "$HOST" "test -d $TARGET && cp -a $TARGET $TARGET.bak.$TS || mkdir -p $TARGET"
fi

# --- rsync -------------------------------------------------------------------
RSYNC_FLAGS=(-av --human-readable --itemize-changes
             --exclude 'assets/properties/'
             --exclude 'assets/img/'
             --exclude '.well-known/'
             --exclude '.DS_Store'
             --exclude '*.swp'
             --omit-dir-times)
[[ $DRY -eq 1 ]] && RSYNC_FLAGS+=(--dry-run)

echo "→ Push Site (inkl. brand/) …"
rsync "${RSYNC_FLAGS[@]}" "$SITE_DIR/" "$HOST:$TARGET/"

# --- Permissions + nginx reload ---------------------------------------------
if [[ $DRY -eq 0 ]]; then
  echo "→ Permissions setzen + nginx reloaden …"
  ssh "$HOST" "
    chown -R www-data:www-data $TARGET &&
    nginx -t &&
    systemctl reload nginx
  "
fi

# --- Smoke-Test --------------------------------------------------------------
if [[ $DRY -eq 0 ]]; then
  echo "→ HTTP-Smoke-Test …"
  status=$(curl -sI -o /dev/null -w '%{http_code}' "https://deal-circle.at/" || true)
  echo "  HTTP $status  ·  https://deal-circle.at/"
  [[ "$status" == "200" ]] || echo "  ⚠  Status nicht 200 — bitte manuell prüfen"
fi

echo
echo "  ✓ Deploy fertig."
[[ $DRY -eq 1 ]] && echo "  (DRY-RUN — nichts wurde tatsächlich geändert)"
echo "  Live: https://deal-circle.at/"
echo
