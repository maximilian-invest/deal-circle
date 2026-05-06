# Deal Circle — Corporate Design

**Release 03 · Mercedes-Anzug-Casino-Royale · Salzburg**
*Skill-konform: `taste-skill` / `redesign-skill` / `brandkit`
(github.com/leonxlnx/taste-skill).*

---

## 0. Brand-Strategie (brandkit-Framework)

| Dimension | Definition |
|---|---|
| **Kategorie** | Off-Market Real Estate · Salzburg-Stadt + Salzkammergut |
| **Zielgruppe** | HNW-Privat, Family Offices, diskrete Verkäufer & Käufer |
| **Persönlichkeit** | Klar · präzise · persönlich · zurückhaltend, nicht herablassend |
| **Kernmetapher** | **Kompass** — Orientierung, Standort, Lage. Real Estate ist Lage. |
| **Logo-Idee** | 4-Punkt-Kompass-Stern (Mercedes-Stern-Reduktion) — geometrisch, ownable, pin-tauglich |
| **Versprechen** | *„Salzburger Immobilien jenseits der öffentlichen Auslage."* |
| **Position** | Persönliche Vermittlung statt Plakatwand. Klein, kuratiert, kein Marketing-Brimborium. |
| **Vermeidet** | Geheimclub-Sprech, Drohnenflüge, lachende Makler, Superlativ-Inflation. |

**Visual Mode** (brandkit): Hybrid aus *Luxury / Beauty / Fashion*
und *Light Editorial* — primär hell ausgespielt (Mercedes-Brochure-Look).

---

## 1. Logo

### Mark · 4-Punkt-Kompass

Ein geometrisch reduzierter Kompass-Stern. Vier Spitzen (N · O · S · W),
zentraler Pivot. Pin-tauglich ab 14 mm, weil reine Silhouette ohne
filigrane Innendetails. Optional umrahmt von einem haarfeinen Ring (Web).

| Datei | Verwendung |
|---|---|
| `logo-monogram.svg` | **Primär** — Web, Print, Visitenkarten, Footer (mit Ring) |
| `logo-pin.svg` | **Reverspin** — nur Stern, ohne Ring |
| `logo-wordmark.svg` | Header, Briefbogen, Präsentationen — Stern + DEAL CIRCLE / SALZBURG |

### Mindestgrößen
- Mark: **20 px** digital · **6 mm** print
- Wordmark: **120 px** digital · **30 mm** print
- Pin (physisch): **14 – 18 mm** Durchmesser

### Schutzraum
Mindestabstand zu anderen Elementen = **Höhe des Pivot-Punkts** (X) auf
allen vier Seiten.

### Don'ts
- Keine Schatten, kein Glow, kein Verlauf (`taste-skill`).
- Niemals stauchen, drehen oder verzerren.
- Niemals neufärben außer nach Farbtafel (§3).

---

## 2. Skill-Compliance

### `taste-skill` (DESIGN_VARIANCE 8 · MOTION_INTENSITY 7 · VISUAL_DENSITY 4)

| Regel | Status |
|---|---|
| NO `#000000` | ✓ Midnight `#0E1A2B` als dunkelster Wert |
| NO Inter | ✓ Cabinet Grotesk (Body) |
| Max 1 Akzent < 80 % Sättigung | ✓ Champagne nur sehr selten, Bordeaux nur „Sold" |
| NO Purple/Blue AI gradient | ✓ |
| Spring Easing, kein Linear | ✓ `cubic-bezier(0.16, 1, 0.3, 1)` |
| `min-h-[100dvh]`, nicht `h-screen` | ✓ Hero |
| `max-w-[1400px]`, `max-w-[65ch]` | ✓ Tokens |
| Tabular-Nums für Daten | ✓ `.dc-tabular` Klasse |
| Magnetic CTA, Cursor Companion | ✓ in `script.js` |
| Hardware-Accel: nur transform/opacity | ✓ alle Animationen |

### `brandkit` Methoden
- **Construction Geometry** ✓ — Stern aus 4 Achsen + Pivot
- **Premium Detail Language** ✓ — Hairlines, Page-Tag, Mono-IDs
- **Visual Mode**: Luxury / Editorial in Hellmodus

### `redesign-skill` Fix-Priority — angewendet auf neue Site
1. Font-Swap → Cinzel + Cabinet Grotesk + Cormorant ✓
2. Color cleanup → Pearl/Platinum/Midnight ✓
3. Hover/Active States → CTA, Cards, Nav-Links ✓
4. Layout → Asymmetric Hero, Bento-Listings ✓
5. Anti-Generic Components → keine 3-Spalten-Cards, kein Modal-Spam ✓
6. Loading/Empty/Error → Form-Submit-Demo ✓
7. Typography Polish → Display-Tracking, max-w-65ch ✓

---

## 3. Farbpalette

| Token | Hex | Rolle |
|---|---|---|
| Pearl | `#EEECE7` | **Primärer Hintergrund** (Hellmodus) |
| Pearl Deep | `#E2DED5` | Sekundärflächen hell |
| Platinum | `#D7D7D5` | Silber-Mark, Pin-Disc |
| Steel | `#A2A4A8` | Hairlines auf hell, Captions |
| Gunmetal | `#4A4D52` | Mid-dark Text, Captions |
| Charcoal | `#2C2C2E` | Dark-Mode-Hintergrund (Galerie-Section) |
| **Midnight** | `#0E1A2B` | **Mark-Color · Primär-Text · Tuxedo-Navy** |
| Midnight Deep | `#080F1A` | Footer, tiefste Fläche |
| Bone | `#F2EFE9` | Text auf Dunkel |
| Champagne | `#C5A572` | Akzent — sehr selten (Reserved-Tag) |
| Bordeaux | `#5C1A1B` | RESERVIERT — nur „Sold/Reserved" |

**Verteilung** (ungefähr):
- 55 % Pearl
- 25 % Midnight (Type, Mark)
- 15 % Steel/Gunmetal (Sekundär)
- 5 % Champagne / Bordeaux / Charcoal kombiniert

---

## 4. Typografie

| Rolle | Schrift | Quelle |
|---|---|---|
| **Display** | Cinzel · 400 / 500 / 600 | Google Fonts |
| **Editorial** | Cormorant Garamond · 300 / 400 / 500 / 600 (+ italic) | Google Fonts |
| **Body** | **Cabinet Grotesk** · 300 / 400 / 500 / 700 | Fontshare |
| **Mono** | JetBrains Mono · 400 / 500 | Google Fonts |

### Tracking & Sizes
```
Hero        clamp(48px, 8vw, 104px)   Cinzel 500   tracking-tighter   leading-none
H1          clamp(34px, 5vw, 56px)    Cinzel 500   tracking-tighter
H2          clamp(20px, 1.8vw, 26px)  Cinzel 500   tracking-tight
Lede        clamp(18px, 1.6vw, 22px)  Cormorant italic 400
Body        16 / 1.6                  Cabinet Grotesk 400 · max-w-65ch
Eyebrow     11 / 1                    Cabinet Grotesk 500 caps · +0.24em
Mono        11 — 13                   JetBrains Mono · +0.12em
```

---

## 5. Reverspin

| Variante | Material | Cipher | Größe |
|---|---|---|---|
| **A · Standard** | Vergoldetes Messing, gebürstet, oder Sterling Silber | Mark in Midnight-Hartemail | **15 mm** |
| **B · Soft Silver** | Rhodiniertes Messing | Mark graviert | **14 mm** |
| **C · Anzug-Schwarz** | Schwarz beschichtet | Mark in Champagne-Inlay | **16 mm** |

Befestigung: Magnet (kein Stechen ins Sakko).

---

## 6. Layoutprinzipien

1. **Asymmetrisch** — kein zentrierter Hero (`taste-skill` ANTI-CENTER).
2. **Hairline-first** — 1 px Steel als Strukturmittel, nicht Cards.
3. **Eyebrow + Section-Title** — jede Section beginnt mit kleinem Caps-Eyebrow + Cinzel-H2.
4. **Bento-Grid** statt 3-Spalten-Reihen.
5. **`min-h-[100dvh]`** im Hero.
6. **Kanten scharf** — `border-radius: 0`.
7. **Generöser Whitespace** — 120 px vertical Section-Padding.
8. **Spring Easing** — alle Transitions `cubic-bezier(0.16, 1, 0.3, 1)`, 320 ms.

---

## 7. Animationen (taste-skill MOTION_INTENSITY 7)

| Effekt | Trigger | Mechanik |
|---|---|---|
| Reveal-on-scroll | `IntersectionObserver` | opacity + translate3d, 1 s spring |
| Parallax-Hero | scroll | `transform: translate3d(0, scrollY * factor, 0)` per rAF |
| Hero-Title-Stagger | section enter | 4 spans mit transition-delay 80/200/320/440 ms |
| Magnetic-CTA | mousemove | cursor pulls button via translate3d, rAF-throttled |
| Cursor-Companion | mousemove | dot folgt cursor mit 0.18 lerp, mix-blend-mode difference |
| Compass slow rotate | always | 90 s pro Umdrehung, `mix-blend-mode: difference` |
| Number-Counter | enter view | cubic ease, 1.4 s, `Intl.NumberFormat('de-AT')` |
| Image-Zoom-on-hover | hover | scale 1.04, 1.4 s linear |
| Sticky-Nav-State | scroll > 24 px | backdrop-filter blur(14px) saturate(140%) |

Alle respektieren `prefers-reduced-motion: reduce`.

---

## 8. Bildwelt

- **Architektur** vor Personen: Salzburger Altstadt, Festungsmauern, Innenräume.
- **Cineastischer Schnitt**: ⅔-Bilder, scharfe Kanten, viel Negativraum.
- **Farbgebung**: leicht entsättigt (`grayscale(0.16) contrast(1.04)`), warmer Lichtkante.
- **Stockverbot**: keine „diverse team"-Stockfotos, keine Drohnen-Aerials.
- **Platzhalter** während Aufbau: `https://picsum.photos/seed/dc-{slug}/1200/800`.

---

## 9. Tonalität (Wording)

**Neu — natürlich, persönlich, ohne Geheimclub-Pose:**
- *„Salzburger Immobilien jenseits der öffentlichen Auslage."*
- *„Wir vermitteln Stadtpalais, Penthouses und Seevillen direkt zwischen Verkäufer und Käufer."*
- *„Drei Salzburger. Zusammen über fünfundzwanzig Jahre Markterfahrung."*
- *„Off-Market ist kein Geheimtuerei-Spiel. Es ist Respekt vor Eigentümern, die nicht wollen, dass ihr Wohnzimmer auf ImmoScout landet."*

**Vermeiden** (`taste-skill` Forbidden):
- „Elevate", „Seamless", „Unleash", „Next-Gen", „Game-changer"
- Ausrufezeichen in Erfolgsmeldungen
- Lorem Ipsum, Title Case On Everything
- Generic-Names („John Doe"), runde Fake-Zahlen (`99,9 %`)

---

## 10. Dateien

```
deal-circle/
├── DEPLOY.md                   ← Deployment-Anleitung (lokal + GH Action)
├── deploy.sh                   ← Lokales Deploy-Skript
├── brand/                      ← deployed nach /var/www/deal-circle/brand/
│   ├── CORPORATE-DESIGN.md
│   ├── tokens.css
│   ├── logo-monogram.svg
│   ├── logo-pin.svg
│   ├── logo-wordmark.svg
│   └── preview.html
└── site/                       ← deployed nach /var/www/deal-circle/
    ├── index.html
    ├── styles.css
    └── script.js
```

```
.github/workflows/
└── deal-circle-deploy.yml      ← Auto-Deploy bei Push
```

---

*Release 03 — Mai 2026. Skill-konform. Pivotiert auf Silver/Pearl/Midnight + Compass-Mark.*
