# Deal Circle Salzburg — Corporate Design

**Release 04 · Hourglass-Cut · Platinum / Onyx**
*Konfidentiell. Kuratiert. Auf Einladung.*

---

## 0. Was die Marke ist

Deal Circle Salzburg ist ein geschlossener Kreis aus jungen Unternehmern,
Gründern, Investoren und Family Offices, der sich sechsmal im Jahr in
**Schloss Wiespach** in Oberalm bei Salzburg trifft. Format: **Diner ·
Speaker · Drinks**. Pro Abend 30 Minuten Vortrag aus der Runde, drei
Stunden Tisch, danach offen am Hof, am Kamin, an der Mauer — bis spät.

| Dimension | Definition |
|---|---|
| **Format** | Sechs Abende pro Jahr · 18 Plätze · Schloss Wiespach |
| **Zugang** | Auf Einladung & Bewerbung. Kein Mitgliedsbeitrag. |
| **Mitglieder** | Junge Unternehmer · Gründer · Investoren · Family Offices |
| **Kernmetapher** | **Sanduhr** — Zeit unter wenigen, drei Stunden am Tisch |
| **Tagline** | *„Wo Salzburg dealt."* |
| **Estd.** | MMXXVI |
| **Position** | Substanz statt Buzzwords. Anti-LinkedIn als Haltung. |

---

## 1. Logo · Hourglass-Cut

### Begründung

Zwei Dreiecke, Spitze an Spitze. Die Sanduhr ohne Rahmen — nur der Sand.
Drei Stunden am Tisch, sechs Mal im Jahr, der präzise Moment in dem
eine Hälfte in die andere kippt. Die Spitzen sind scharf, der Schnitt
dazwischen gerade. Kein weicher Übergang, kein Schmuck.

Bei 14 mm bleibt eine einzige geometrische Silhouette: zwei Spitzen,
ein Schnitt, ein Treffen, das stattgefunden hat.

### Geometrie (200×200 viewBox)

```
Top-Triangle      Punkte:  36,28  · 164,28  · 100,94
Bottom-Triangle   Punkte:  100,106 · 164,172 · 36,172
Pinch-Akzent      Rect:    x 92, y 98, 16 × 4

Gesamthöhe:       144 px
Basisbreite:      128 px
Spalt:            12 px (y 94 → 106)
Pinch:            16 × 4 zentriert
Achse:            x = 100
Schutzraum:       0.4 × Gesamthöhe (≈ 58 px)
Mindestgröße:     14 mm physisch · 22 px digital
```

### Varianten

| Datei | Verwendung |
|---|---|
| `logo-monogram.svg` | Hauptmark — Web, Print, Visitenkarten, Footer |
| `logo-pin.svg` | Reverspin — gleiche Silhouette, separate Datei für Druckerei |
| `logo-wordmark.svg` | Horizontaler Lockup mit „DEAL CIRCLE / SALZBURG · ESTD MMXXVI" |
| `hourglass.js` | DOM-Helper für die Live-Site (`window.DCMarkSVG(size, color)`) |

### Don'ts

- Nicht drehen (kippt die Metapher).
- Nicht in zwei Hälften trennen (verliert den Schnitt).
- Nicht mit Verlauf füllen — flat oder mit dem definierten Silver-Gradient.
- Nicht auf unruhigen Hintergründen ohne Tönungsfläche.
- Nicht mit der Wortmarke vermischen außer im offiziellen Lockup.

---

## 2. Farbpalette

| Token | Hex | Rolle |
|---|---|---|
| **Onyx** | `#050608` | **Primärer Hintergrund** — die Site lebt im Schwarz |
| Onyx Deep | `#08090B` | Tiefster Schwarzwert (Footer, Pin-Hintergrund) |
| Onyx Soft | `#0D1014` | Hero-Verlaufzentrum |
| **Platinum** | `#C8CDD3` | **Mark-Color · Akzent** |
| Silver | `#E8EBEE` | Highlight-Silber |
| Silver Hot | `#F4F6F8` | Spotlight für Verläufe |
| Steel | `#5A6068` | Sub-Labels, mid-grey |
| Gunmetal | `#3A4048` | Tiefster Mid-Tone |
| **Paper** | `#F2EFE8` | **Light-Sections** (Quote, Members) |
| Paper Deep | `#E8E3D7` | Paper deeper für Akzente |
| Ink | `#0A0B0D` | Text auf Paper |
| Gold Trace | `#B8A978` | gilt accent — sehr sparsam (Stamp, Pulse-Indikator) |
| Bordeaux | `#5C1A1B` | RESERVIERT — Sondermarker |

**Verteilung:** ~70 % Onyx · ~15 % Platinum/Silver · ~10 % Paper (für die zwei Light-Sections) · 5 % Gold-Trace.

---

## 3. Typografie

| Rolle | Schrift | Quelle | Einsatz |
|---|---|---|---|
| **Display** | Cinzel · 400 / 500 / 600 / 700 | Google Fonts | Hero-Wordmark, Section-Titles, Stats-Numbers |
| **Editorial** | Cormorant Garamond · 300 / 400 / 500 (+ italic) | Google Fonts | Tagline, Lede, Manifesto, Quote |
| **Body** | Cabinet Grotesk · 400 / 500 / 700 / 800 | Fontshare | Body, Buttons, Labels |
| **Mono** | JetBrains Mono · 400 / 500 | Google Fonts | Page-Tag, Section-Eyebrows, Mono-Labels |

**Inter ist nicht zu verwenden.** Cabinet Grotesk hat den editorialen Charakter, den die Marke braucht.

### Skala (mobil → desktop)

```
Hero-Wordmark   clamp(64px, 14vw, 220px)   Cinzel 500   tracking 0.04em
Manifesto       clamp(48px, 8.5vw, 144px)  Cormorant Italic 300
Section-Title   clamp(40px, 5.6vw, 84px)   Cinzel 500   tracking 0.04em UPPER
Quote           clamp(32px, 5vw, 72px)     Cormorant Italic 300
Stats-Number    clamp(64px, 8vw, 124px)    Cinzel 400   gradient fill
Lede            22px / 1.5                 Cormorant Italic 300
Body            16.5px / 1.75              Cabinet Grotesk 400
Eyebrow         11px caps, +0.3em tracking JetBrains Mono 500
Page-Tag        10px caps, +0.3em tracking JetBrains Mono
```

---

## 4. Reverspin

| Variante | Material | Mark | Größe |
|---|---|---|---|
| **A · Sterling poliert** | Sterling Silver, hochglanzpoliert | Hourglass graviert in Anthrazit | **15 mm** |
| **B · Platinum + Onyx-Email** | Brushed Platinum mit eingelegter Onyx-Email-Mitte | Hourglass in Platinum auf Onyx | **15 mm** |
| **C · Anthrazit beschichtet** | Schwarz beschichtetes Messing | Hourglass in Platinum-Inlay | **15 mm** |

Befestigung: Magnet (kein Stechen ins Sakko-Revers).

Die Sandstrom-Animation der Live-Site ist die digitale Erweiterung der
physischen Reverspin-Erfahrung — ein Mitglied trägt, was die Site zeigt.

---

## 5. Bewegungs-System (Live-Site)

Die Hourglass ist nicht nur ein statisches Mark — sie ist die zentrale
Animation der Site.

| Gestaltungselement | Trigger | Mechanik |
|---|---|---|
| **Title-Sequence Intro** | Page-Load | Iris öffnet sich aus 200 px Radius, Mark fadet ein, „Estd. MMXXVI" |
| **Pinned Hourglass** | Scroll im Hero | Sand fließt von oben nach unten als Funktion von `scrollY / docMax` |
| **Hourglass-Rotation** | Scroll | Rotor dreht 0.5 Umdrehungen über die ganze Page-Höhe |
| **Letter-Stagger** | Page-Load | Hero-Wordmark Buchstaben-für-Buchstabe (45 ms cascade) |
| **Manifesto-Word-Reveal** | Section enter | Word-Lines mit `transform: translateY(110%)`, gestaffelt |
| **Stat-Counter** | 60 % in viewport | requestAnimationFrame, cubic-out, 1.4 s |
| **Custom Cursor** | always (hover-fähige Pointer) | 28 px Halo + 4 px Dot, lerp 0.18, mix-blend-mode difference |
| **Topbar-Light-Flip** | Scroll über Light-Section | Klassen-Toggle `on-light`, BG + Text-Color invertiert |
| **Format-Track** | Scroll innerhalb des Tracks | Wheel-deltaY → scrollLeft horizontal |
| **Location-Stamp** | always | Rundtext-Stamp rotiert 360° in 24 s |
| **Pulse-Gold** | Status „Nächster" | Gold-Dot pulsiert 1.6 s |

Alle Animationen respektieren `prefers-reduced-motion: reduce`.

---

## 6. Tonalität · Wording-Inventar

### Identitätssätze
- *„Konfidentiell. Kuratiert. Auf Einladung."*
- *„Sechs Abende. Achtzehn Plätze. Schloss Wiespach. Auf Einladung."*
- *„Wo Salzburg dealt."*
- *„Bond am Tresen, nicht in der Lobby."* (intern)

### Format-Sprache
- Diner · Speaker · Drinks · Excursio
- Hof · Kamin · Mauer
- „Whiskey, Wein, Wasser." (Drinks)
- „Vier Gänge aus der Schlossküche."
- „Wer sitzt, sitzt absichtlich."

### Members-Prinzipien
- *I — Auf Einladung & Bewerbung* — kein Mitgliedsbeitrag, kein Marktplatz.
- *II — Substanz statt Buzzwords* — These statt Deck. Anti-LinkedIn als Haltung.
- *III — Was am Tisch bleibt* — Vertrauen ist das, was wir in Wahrheit servieren.
- *IV — Die Stunde reicht* — sechs Abende sind genug. Kein Slack, keine WhatsApp-Gruppe, kein Newsletter.

### Vermeiden
- „Networking", „Plattform", „Verein", „Premium-Community"
- Buzzwords: Elevate · Seamless · Unleash · Next-Gen
- Ausrufezeichen in Erfolgsmeldungen
- „Members" statt „Mitglieder" ist OK — als Markenwort etabliert.
- Englisch-Deutsch-Mix sparsam (Members, Speaker, Excursio).

---

## 7. Bildwelt

- Schlossmauern bei Kerzenlicht — kein Hochglanz, eher Reportage
- Innenhof mit Fackeln, Park nach dem Diner
- Tische, Wein, Hände — niemals Gesichter ohne Zustimmung
- Schloss-Stamp-Motiv (kreisförmiger Rundtext) als wiederkehrendes Detail
- *Verboten*: Stockfotos, lachende Geschäftsleute, Drohnen-Aerials,
  Handshake-Klischees

---

## 8. Dateien

```
deal-circle/
├── DEPLOY.md                     ← Deploy-Anleitung
├── deploy.sh                     ← rsync-basiertes lokales Deploy-Skript
└── site/                         ← deployed nach /var/www/deal-circle/
    ├── index.html                ← die ganze Site (inline styles + script)
    ├── brand.css                 ← shared tokens + .dc-btn
    ├── hourglass.js              ← window.DCMark + window.DCMarkSVG
    └── brand/                    ← Brand-Assets, kanonisch
        ├── CORPORATE-DESIGN.md   ← dieses Dokument
        ├── tokens.css            ← CSS-Custom-Properties
        ├── preview.html          ← Browser-Vorschau aller Assets
        ├── logo-monogram.svg     ← Hauptmark
        ├── logo-pin.svg          ← Reverspin-Variante (gleiche Geometrie)
        └── logo-wordmark.svg     ← horizontaler Lockup
```

```
.github/workflows/
└── deal-circle-deploy.yml        ← Auto-Deploy bei Push
```

---

*Release 04 — Mai 2026 · Hourglass-Cut, Platinum/Onyx, Sechs-Abende-Format.*
