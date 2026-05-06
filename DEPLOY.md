# Deal Circle — Deployment

Zwei Wege deployen das Branding und die Site auf **deal-circle.at**:

---

## A · Lokal (einmaliger Befehl, sofort live)

Auf deinem Rechner mit deinem SSH-Key (`~/.ssh/id_ed25519`):

```bash
git pull origin claude/find-landing-page-7JoBr
bash deal-circle/deploy.sh
```

Das Skript:
1. testet die SSH-Verbindung zu `srhomes-vps`,
2. fragt einmal nach Bestätigung (oder `--yes` zum Skippen),
3. erstellt am Server ein Backup (`/var/www/deal-circle.bak.<timestamp>`),
4. rsynct `deal-circle/site/` (inkl. `brand/`) → `/var/www/deal-circle/`,
5. setzt `chown www-data` + `nginx -t && systemctl reload nginx`,
6. ruft `https://deal-circle.at/` ab und prüft HTTP 200.

**Sicherheit**:
- `assets/properties/`, `assets/img/`, `.well-known/` werden vom rsync **ausgeschlossen** — deine Bildergalerie und das Let's-Encrypt-Verzeichnis bleiben unangetastet.
- `--delete` wird **nicht** verwendet — am Server vorhandene Dateien werden nicht gelöscht.
- Vor jedem Deploy gibt's ein vollständiges Backup.

**Optionen**:
- `--dry-run` — zeigt nur, was passieren würde, ändert nichts
- `--yes` — keine Rückfrage, direkt deployen

---

## B · GitHub Action (Auto-Deploy bei jedem Push)

Sobald die unten beschriebenen drei Secrets im Repo gesetzt sind, deployt
**`.github/workflows/deal-circle-deploy.yml`** automatisch bei jedem Push,
der `deal-circle/site/`, `deal-circle/brand/` oder `deploy.sh` ändert.

### Setup (einmalig, ~3 Min.)

1. **SSH-Public-Key auf den VPS legen** (falls noch nicht):
   ```bash
   ssh-copy-id -i ~/.ssh/id_ed25519 srhomes-vps
   ```

2. **Known-Hosts-Eintrag generieren** (lokal):
   ```bash
   ssh-keyscan -t ed25519 187.124.166.153 > /tmp/dc-known-hosts.txt
   cat /tmp/dc-known-hosts.txt
   ```
   → Output kopieren.

3. **Drei Repository-Secrets im GitHub-UI hinzufügen**:
   `Settings → Secrets and variables → Actions → New repository secret`

   | Name | Wert |
   |---|---|
   | `DC_SSH_PRIVATE_KEY` | Inhalt von `~/.ssh/id_ed25519` (kompletter PEM-Block, inkl. BEGIN/END-Zeilen) |
   | `DC_SSH_HOST` | `187.124.166.153` |
   | `DC_SSH_KNOWN_HOSTS` | Output von Schritt 2 |

4. **Action manuell triggern** (zur Erstvalidierung):
   `Actions → Deal Circle — Deploy → Run workflow`

Ab jetzt: jeder Commit, der `deal-circle/site/` oder `/brand/` ändert,
deployt automatisch — inklusive Backup, nginx-Reload, Smoke-Test.

---

## C · Manuell (rsync-Einzeiler ohne Skript)

Falls das Skript zickt:

```bash
rsync -av --exclude 'assets/properties/' --exclude '.well-known/' \
  deal-circle/site/  srhomes-vps:/var/www/deal-circle/

ssh srhomes-vps 'chown -R www-data:www-data /var/www/deal-circle && nginx -t && systemctl reload nginx'
```

---

## Rollback

Jedes Deploy schreibt ein Timestamped-Backup. Auf den letzten Stand zurück:

```bash
ssh srhomes-vps '
  cd /var/www
  ls -dt deal-circle.bak.* | head -1
  # ↑ den Pfad anschauen, dann:
  rm -rf /var/www/deal-circle
  mv /var/www/deal-circle.bak.<TIMESTAMP> /var/www/deal-circle
  systemctl reload nginx
'
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `ssh: Could not resolve hostname srhomes-vps` | `~/.ssh/config` Eintrag fehlt / falsch |
| `Permission denied (publickey)` | `ssh-add ~/.ssh/id_ed25519` |
| `nginx: configuration file test failed` | `ssh srhomes-vps 'nginx -T'` lokal anschauen |
| HTTP 502/503 nach Deploy | Backup zurückspielen, dann manuell debuggen |
| Bilder weg | rsync-`--delete` versehentlich aktiviert? Backup zurück. |

---

## Was wird wo deployt?

```
deal-circle/site/                →  /var/www/deal-circle/
├── index.html                   →  /var/www/deal-circle/index.html
├── styles.css                   →  /var/www/deal-circle/styles.css
├── script.js                    →  /var/www/deal-circle/script.js
└── brand/                       →  /var/www/deal-circle/brand/
    ├── tokens.css
    ├── logo-monogram.svg
    ├── logo-pin.svg
    ├── logo-wordmark.svg
    ├── CORPORATE-DESIGN.md
    └── preview.html
```

Die Site referenziert Brand-Assets über **relative Pfade** (`./brand/...`),
damit Preview lokal/htmlpreview UND deployed identisch funktioniert.
