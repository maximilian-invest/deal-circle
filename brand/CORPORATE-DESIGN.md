# Deal Circle — Corporate Design

**Release 02 · Bond-inspired Identity · Salzburg**
*Erstellt unter Anwendung der `taste-skill`, `redesign-skill` und `brandkit`-Methodik
(github.com/leonxlnx/taste-skill).*

---

## 0. Brand-Strategie (brandkit-Framework)

| Dimension | Definition |
|---|---|
| **Kategorie** | Off-Market Luxury Real Estate · Salzburg-Stadt + Salzkammergut |
| **Zielgruppe** | HNW-Privat, Family Offices, diskrete Verkäufer & Käufer |
| **Persönlichkeit** | Diskret · präzise · zurückhaltend · österreichisch-souverän |
| **Kernmetapher** | **Petschaft / Signet** — der Siegelring als Zeichen der vereinbarten Vertraulichkeit |
| **Logo-Idee** | Monogramm-Cipher „D · C" innerhalb eines Kreises. Der Kreis ist die *Circle* — der Vertragsbund. Das Diamant-Diakritikon ist die Kerbe im Wachs. |
| **Versprechen** | *„Acht Adressen. Auf Anfrage. Unter NDA."* |
| **Kulturelle Position** | Das Gegenteil der Sotheby's-Plakatwand. Mehr Privatclub als Schaufenster. |
| **Was die Marke vermeidet** | Hochglanz-Renderings, Drohnen-Aerials, lachende Makler, Superlativ-Inflation. |

**Visual Mode (brandkit)**: Hybrid aus *Luxury / Beauty / Fashion* (Serifen, Embossing,
Stein/Espresso) und *Light Editorial / Compliance* (Siegel-Logik, präzise Stationery).
Primär dunkel ausgespielt — **Dark Luxury**.

---

## 1. Logo

### Aufbau (brandkit · Methode 1: Monogram + Meaning, Methode 5: Construction Geometry)

Ein **Monogramm „D · C"** in Cinzel-Serife, gesetzt in einem haarfeinen Kreis-Siegel.
Das Diamant-Diakritikon zwischen den Lettern ist die einzige ornamentale Geste —
es markiert den *Vertragspunkt*, den Moment, an dem der Deal zustande kommt.

### Varianten

| Datei | Verwendung |
|---|---|
| `logo-monogram.svg` | **Primär** — Web, Print, Visitenkarten, Footer |
| `logo-monogram-alt.svg` | **Alternative** — Bond-Title-Cipher: D solid, C gestochen, überlappt |
| `logo-wordmark.svg` | Header, Briefbogen, Präsentationen |
| `logo-pin.svg` | **Reverspin** — nur Cipher, ohne Ringe (der Pin ist der Kreis) |

### Mindestgrößen
- Monogramm: **24 px** digital · **8 mm** print
- Wordmark: **120 px** digital · **30 mm** print
- Pin (physisch): **14 – 18 mm** Durchmesser

### Schutzraum
Mindestabstand zu anderen Elementen = **Höhe des Diamant-Markers** (X) auf allen vier
Seiten. Auf weniger genug Platz: einfacher Stack ohne Wordmark.

### Don'ts (taste-skill + brandkit)
- Keine Schatten, keine Verläufe, kein Glow (`taste-skill`: NO neon, NO gradients).
- Niemals stauchen oder verzerren.
- Niemals neufärben außer nach Farbtafel (§3).
- Niemals Inter-Font für „SALZBURG" — Cabinet Grotesk (§4).
- Niemals als 3-Spalten-Card-Reihe wiederholen (`taste-skill`: NO 3-column).

---

## 2. Skill-Compliance (Audit-Trail)

### `taste-skill` (DESIGN_VARIANCE 8 · MOTION_INTENSITY 6 · VISUAL_DENSITY 4)

| Regel | Status |
|---|---|
| NO `#000000` | ✓ Onyx = `#0B0B0C` |
| NO Inter font | ✓ Cabinet Grotesk als Body |
| Max 1 Akzent · < 80 % Sättigung | ✓ Champagne `#C5A572` (Bordeaux nur Sondermarker) |
| NO Purple/Blue AI gradient | ✓ |
| Serif nur für Editorial, nicht Dashboard | ✓ Marketing/Editorial-Kontext |
| Tabular-Nums für Daten | ✓ `--dc-tabular` Klasse |
| `min-h-[100dvh]`, nicht `h-screen` | (für Landing-Page-Code reserviert) |
| `max-w-[1400px]`, `max-w-[65ch]` | ✓ Tokens definiert |
| Spring Physics statt linear | ✓ `--dc-ease: cubic-bezier(0.16, 1, 0.3, 1)` |

### `redesign-skill` (Fix Priority — wird beim Site-Rebuild angewendet)
1. Font swap → erledigt im Token-System.
2. Color cleanup → 60/30/10-Regel im CD verankert.
3. Hover/Active-States → Spec liegt in §7 unten.
4. Layout & Spacing → Spec liegt in §6.
5. Generic Components ersetzen → später beim Site-Bau.
6. Loading / Empty / Error States → später beim Site-Bau.
7. Typography Polish → §4.

### `brandkit` (angewendete Konzept-Methoden)
- **Monogram + Meaning** ✓ — D·C als Cipher mit Vertragsmetapher.
- **Construction Geometry** ✓ — Kreis als Konstruktionsbasis.
- **Negative Space** (Variante) ✓ — `logo-monogram-alt.svg`: gestochenes C neben solidem D.
- **Premium Detail Language** ✓ — Hairlines, kleine Footer-Labels, Section-Eyebrows.

---

## 3. Farbpalette

| Token | Hex | Rolle |
|---|---|---|
| Onyx | `#0B0B0C` | Primär-Hintergrund (taste-skill: kein `#000`) |
| Tuxedo | `#141416` | Sekundärflächen |
| Charcoal | `#1C1C1E` | Cards (sparsam) |
| Bone | `#F2EFE9` | Primärtext auf Dunkel / Lightmode-BG |
| Bone Soft | `#C9C5BC` | Sekundärtext |
| **Champagne** | `#C5A572` | **Einziger Akzent** (Logo, Hairlines, CTAs) |
| Champagne Deep | `#A88857` | Hover, Press |
| Smoke | `#6E6E70` | Captions, Meta |
| Hairline | `#2A2A2D` | 1px Trennlinien |
| Bordeaux | `#5C1A1B` | RESERVIERT — *nur* „Sold/Reserved"-Tags, max. 1× pro Viewport |

**Regel 60 / 30 / 10**: 60 % Onyx · 30 % Bone · 10 % Champagne. Bordeaux fällt
außerhalb dieser Verteilung als reine Markierung — nicht als Designelement.

---

## 4. Typografie (taste-skill-konform)

| Rolle | Schrift | Quelle | Einsatz |
|---|---|---|---|
| **Display** | Cinzel · 400 / 500 / 600 | Google Fonts | Logo, Hero, H1 |
| **Editorial** | Cormorant Garamond · 300 / 400 / 500 / 600 (+ italic) | Google Fonts | H2 – H4, Pull-Quotes |
| **Body** | **Cabinet Grotesk** · 300 / 400 / 500 / 700 | Fontshare | Paragraphen, UI, Nav, Buttons |
| **Mono** | JetBrains Mono · 400 / 500 | Google Fonts | Listing-IDs, Daten, Tabular-Nums |

**Inter ist gebannt** (taste-skill: „NO Inter Font: Banned"). Als Body kommt
**Cabinet Grotesk** zum Einsatz — höhere Charakterstärke, editorialer Premium-Anspruch.

### Tracking
- Display Hero: `tracking-tighter` (`-0.02em`)
- Display Wordmark: `+0.06em – 0.08em`
- Eyebrows / Caps-Labels: `+0.24em`
- Body: 0
- Caption-Caps: `+0.12em`

### Skala (mobil → desktop)
```
Hero        56 → 96 px   Cinzel 500    leading-none
H1          42 → 72 px   Cinzel 500
H2          25 → 32 px   Cormorant 500
H3          20 → 25 px   Cormorant 500 italic
Lead        18 → 20 px   Cormorant 400
Body        16 → 16 px   Cabinet Grotesk 400 · max-w-[65ch]
Caption     12 → 13 px   Cabinet Grotesk 500 caps · +0.12em
```

---

## 5. Reverspin — Spezifikationen

Drei Ausführungen je Anlass / Träger:

### A · Champagne / Onyx (Standard)
- Material: vergoldetes Messing, leicht gebürstet
- Cipher: schwarzer Hartemail (Onyx)
- Durchmesser: **15 mm**
- Befestigung: Magnet (kein Stechen ins Sakko)

### B · Soft Silver
- Material: rhodiniertes Messing
- Cipher: graviert
- Durchmesser: **14 mm**

### C · Onyx / Champagne Inverse
- Material: schwarz beschichtetes Messing
- Cipher: gravierter Champagne-Inlay
- Durchmesser: **16 mm** · Anlass: Abend, schwarzer Anzug

**Datei**: `logo-pin.svg` — bei A/C in Champagne, bei B mit invertiertem Filter.

---

## 6. Layoutprinzipien (taste-skill DESIGN_VARIANCE 8)

1. **Hairline first** — Trennlinien als Strukturmittel, nicht Boxen.
2. **Eyebrow + Headline** — jede Section beginnt mit kleinem Caps-Eyebrow
   („SECTION 01 — INVENTORY") über Cinzel-Headline.
3. **Asymmetrisch** — kein zentrierter Hero (`taste-skill`: ANTI-CENTER BIAS bei Variance > 4).
   Split-Screen, links-aligned Headline mit rechts-aligned Asset, oder asymmetrisches Whitespace.
4. **Generöser Whitespace** — mind. 80 px vertikales Section-Padding (Desktop).
5. **Keine Rundungen** — `border-radius: 0`. Editorial-Schärfe.
6. **Bewegung minimal** — `cubic-bezier(0.16, 1, 0.3, 1)`, 300 ms, keine Bouncy-Easings,
   keine Linear-Easings.
7. **Bento statt 3-Card-Row** (`taste-skill`: NO 3-column-card layouts) — Listings
   als asymmetrisches Grid (z. B. 2fr 1fr 1fr).
8. **`min-h-[100dvh]`** statt `h-screen` (Mobile Safari Bug).

---

## 7. Interaktion & States (redesign-skill)

| State | Spec |
|---|---|
| **Hover** | `transition: all 300ms cubic-bezier(0.16, 1, 0.3, 1)`; Background-Shift OR `translateY(-1px)`. |
| **Active/Press** | `translateY(1px)` ODER `scale(0.98)` — taktiles Feedback. |
| **Focus-Ring** | 2px Champagne-Outline, `outline-offset: 3px` (Pflicht — Accessibility). |
| **Loading** | Skeleton-Loader in Layout-Form, *nie* runde Spinner. |
| **Empty** | komponiertes „Getting started"-Layout, kein leerer Bereich. |
| **Error** | inline, unterhalb des Felds, Bordeaux-Indikator + Cabinet Grotesk Italic. |

---

## 8. Bildwelt (brandkit · Image Direction)

- **Architektur** vor **Personen**: Salzburger Altstadt, Festungsmauern, Innenräume.
  Kein Hochglanz, eher Black-and-White-Reportage.
- **Cineastischer Schnitt**: ⅔-Bilder, harte Kanten, viel negativer Raum für
  Headlines (links oder rechts).
- **Farbgebung**: leicht entsättigt mit warmer Lichtkante (Champagne).
- **Stockverbot** (taste-skill): keine „diverse team"-Stockfotos, keine Drohnen-Standard.
- **Platzhalter**: `https://picsum.photos/seed/dc-{slug}/1920/1080` — *nicht* Unsplash.

---

## 9. Tonalität (Copy)

- **Knapp.** Wie ein Briefing in M's Office.
- **Wir-Form**.
- **Keine AI-Cliché-Verben** (`taste-skill` Forbidden List): kein „Elevate",
  „Seamless", „Unleash", „Next-Gen", „Game-changer".
- **Numerisch wo möglich**: Quadratmeter, Baujahr, Listing-Nr. statt Adjektiven.
- **Keine Ausrufezeichen** in Success-Messages (`redesign-skill`).
- **Aktiv statt passiv**.
- **Sentence case in Headlines**, nicht Title Case.

**Beispiel-Ton**:
> *Acht Objekte. Salzburg-Stadt und Salzkammergut. Vom Stadtpalais bis zur Seevilla
> — auf Anfrage, unter NDA, mit Voranmeldung.*

---

## 10. Dateien

```
deal-circle/brand/
├── CORPORATE-DESIGN.md          ← dieses Dokument (Release 02)
├── tokens.css                   ← CSS Custom Properties · skill-konform
├── logo-monogram.svg            ← Hauptmarke
├── logo-monogram-alt.svg        ← Alternative: Bond-Title-Cipher
├── logo-pin.svg                 ← Reverspin
├── logo-wordmark.svg            ← horizontaler Lockup
└── preview.html                 ← Browser-Vorschau aller Assets
```

**Schnellstart in der Site**:
```html
<link rel="stylesheet" href="/brand/tokens.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://api.fontshare.com">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@300,400,500,700&display=swap" rel="stylesheet">
```

---

*Release 02 — Mai 2026. Skill-konform. Änderungen über das Repo, nie direkt am Server.*
