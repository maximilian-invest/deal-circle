# Deal Circle — Corporate Design

**Release 01 · Bond-inspired Identity · Salzburg**

---

## 1. Markenessenz

Deal Circle steht für diskrete, kuratierte Immobiliengeschäfte auf höchstem
Niveau. Die visuelle Sprache lehnt sich an die zurückhaltende Eleganz klassischer
Bond-Filme an: Onyx-Schwarz, Champagner-Gold, Serifen mit cinematischer
Spreizung, viel Weißraum, scharfe Hairlines. Kein Glanz, kein Pomp — sondern
geschnittene Souveränität.

> *"Understated, never underspecified."*

---

## 2. Logo

### Aufbau
Ein **Monogramm „D · C"** (Cinzel-Serife) zwischen zwei konzentrischen Ringen.
Das Diamant-Trennzeichen zwischen den Lettern hält die Komposition optisch in
Balance.

### Varianten
| Datei | Verwendung |
|---|---|
| `logo-monogram.svg` | Web, Print, Visitenkarten, Footer |
| `logo-wordmark.svg` | Header, Briefbogen, Präsentationen |
| `logo-pin.svg` | **Reverspin / Lapel-Pin** — nur Cipher, ohne Ringe |

### Mindestgrößen
- Monogramm: **24 px** digital · **8 mm** print
- Wordmark:  **120 px** digital · **30 mm** print
- Pin (physisch): **14 – 18 mm** Durchmesser

### Schutzraum
Mindestabstand zu anderen Elementen = **Höhe des Diamant-Markers** (X)
auf allen vier Seiten.

### Don'ts
- Keine Schatten, keine Verläufe, kein Glow
- Niemals stauchen oder verzerren
- Niemals neufärben außer nach Farbtafel (§3)
- Niemals auf unruhige Hintergründe ohne Tönungsfläche

---

## 3. Farbpalette

| Token | Hex | Rolle |
|---|---|---|
| Onyx | `#0B0B0C` | Primärer Hintergrund |
| Tuxedo | `#141416` | Cards, sekundäre Flächen |
| Bone | `#F2EFE9` | Primärer Text auf Dunkel |
| Bone Soft | `#C9C5BC` | Sekundärer Text |
| **Champagne** | `#C5A572` | **Akzent / Logo / Hairlines** |
| Champagne Deep | `#A88857` | Hover, Tiefe |
| Smoke | `#6E6E70` | Meta / Captions |
| Hairline | `#2A2A2D` | Trennlinien |
| Bordeaux | `#5C1A1B` | Sondermarker (sehr sparsam) |

**Regel 60-30-10**: 60 % Onyx, 30 % Bone, 10 % Champagne.
Bordeaux nur für „Reserved"/„Sold"-Tags oder einzelne Detail-Akzente.

---

## 4. Typografie

| Rolle | Schrift | Quelle | Einsatz |
|---|---|---|---|
| **Display** | Cinzel · 400 / 500 / 600 | Google Fonts | Logo, Hero, H1 |
| **Editorial** | Cormorant Garamond · 300 / 400 / 500 / 600 (+ ital) | Google Fonts | H2 – H4, Pull-Quotes |
| **Body** | Inter · 300 / 400 / 500 | Google Fonts | Paragraphen, UI, Nav |
| **Mono** | JetBrains Mono · 400 / 500 | Google Fonts | Listing-IDs, Daten, Codes |

### Tracking (letter-spacing)
- Display-Caps (H1, Logo): **+ 60–80‰** (`0.06–0.08em`)
- Section-Eyebrows („SECTION 01 — …"): **+ 240‰** (`0.24em`)
- Body: 0
- Caption-Caps: **+ 120‰** (`0.12em`)

### Skala (mobil → desktop)
```
Hero        56 → 96 px   Cinzel 500
H1          42 → 72 px   Cinzel 500
H2          25 → 32 px   Cormorant 500
H3          20 → 25 px   Cormorant 500 italic
Lead        18 → 20 px   Cormorant 400
Body        16 → 16 px   Inter 400
Caption     12 → 13 px   Inter 500 caps
```

---

## 5. Reverspin — Spezifikationen

Drei mögliche Ausführungen, je nach Träger / Anlass:

### A · Champagne / Onyx (Standard)
- Material: vergoldetes Messing (Champagne, leicht gebürstet)
- Cipher: schwarzer Hartemail (Onyx)
- Durchmesser: **15 mm**
- Befestigung: Magnet (kein Stechen ins Sakko)

### B · Soft Silver
- Material: rhodiniertes Messing (kühles Silber)
- Cipher: graviert (kein Email)
- Durchmesser: **14 mm**

### C · Onyx / Champagne Inverse
- Material: schwarz beschichtetes Messing
- Cipher: gravierter Champagner-Inlay
- Durchmesser: **16 mm**
- Anlass: Abend, schwarzer Anzug

**Datei**: `logo-pin.svg` (transparenter Hintergrund — Pin-Form übernimmt der Kreis).

---

## 6. Bildwelt

- **Architektur** vor **Personen**: Salzburger Altstadt, Festungsmauern, weite
  Innenräume mit Tiefe. Kein Hochglanz-Renderings, eher Black-and-White-Reportage.
- **Schnitt cineastisch**: ⅔-Bilder, harte Kanten, viel negativer Raum links
  oder rechts für Headlines.
- **Farbgebung**: leicht entsättigt mit warmer Lichtkante (Champagner).
- **Verboten**: Stockfotos mit lachenden Maklern, Handshake-Klischees, Aerial-
  Drohnen-Standardansichten.

---

## 7. Layoutprinzipien

1. **Hairline first** — Trennlinien (1px / `--dc-hairline`) sind das primäre
   Strukturelement, nicht Boxen oder Cards.
2. **Eyebrow + Headline** — jede Section beginnt mit kleinem Caps-Eyebrow
   („SECTION 01 — INVENTORY") über dem Cinzel-Headline.
3. **Asymmetrisch** — vermeide perfekt zentrierte Hero-Layouts. Headline links,
   Bild rechts (oder umgekehrt).
4. **Generöser Whitespace** — mind. 80 px vertikaler Section-Padding (desktop).
5. **Keine Rundungen** — `border-radius: 0`. Das Brand bleibt geschnitten.
6. **Bewegung minimal** — `cubic-bezier(0.22, 0.61, 0.36, 1)`, 320ms,
   keine Bouncy-Easings.

---

## 8. Tonalität (Copy)

- **Knapp.** Wie ein Briefing in M's Office.
- **Erste Person Plural** (Wir kuratieren …, Wir handeln …).
- **Keine Superlativ-Inflation** — kein „Marktführer", „einzigartig", „revolutionär".
- **Numerisch, wo möglich** — Quadratmeter, Baujahr, Listing-Nr. statt Adjektive.
- **Deutsch** als Primärsprache, **Englisch** als Reserve für internationale
  Kunden (kein Denglisch-Mix).

**Beispiel-Ton**:
> *Acht Objekte. Salzburg-Stadt und Salzkammergut. Vom Stadtpalais bis zur
> Seevilla — auf Anfrage, unter NDA, mit Voranmeldung.*

---

## 9. Dateien & Tokens

```
deal-circle/brand/
├── CORPORATE-DESIGN.md      ← dieses Dokument
├── tokens.css               ← CSS Custom Properties
├── logo-monogram.svg        ← Hauptmarke
├── logo-pin.svg             ← Reverspin-Variante
├── logo-wordmark.svg        ← horizontaler Lockup
└── preview.html             ← Browser-Vorschau aller Assets
```

**Schnellstart** in der Site:
```html
<link rel="stylesheet" href="/brand/tokens.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,400&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
```

---

*Release 01 — Stand: Mai 2026. Änderungen über das Repo, nicht direkt am Server.*
