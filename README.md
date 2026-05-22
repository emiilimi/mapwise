# MapWise

> Crossover av Lucidspark og PowerPoint. Bygg et tankekart av noder koblet med piler, og presenter det — eller eksporter hele greia som én selvinneholdt HTML-fil.

## Konsept

Hvert kart er én fil (`.html`). Filen inneholder både visningsapp og data, og kan importeres tilbake i editoren for videre redigering.

### Nodetyper

| Type | Beskrivelse |
|---|---|
| **Slide-boks** | Markdown-innhold med YAML frontmatter. Kan brukes i presentasjon. |
| **Tekstnotat** | Løs tekst uten ramme. Nyttig for kart-annotering. |
| **Bildenode** | Standalone bilde (URL eller lokal fil). Kan også presenteres. |

### Frontmatter (slide-bokser)

```yaml
---
slide: 3          # presentasjonsrekkefølge (støtter desimaler: 3.5)
thumbnail: Tittel # vises når kartet er zoomet ut
summary: ...      # oppsummering vist i utforsk-modus
fixedForm: true   # overstyrer kart-innstillingen per slide
---

Innhold her.

---step---

Neste steg (avsløres én om gangen i presentasjonsmodus).
```

### Fast form (fixedForm)

Når `fixedForm` er aktivert (globalt eller per slide) låses sideforholdet (standard 16:9), og teksten krymper automatisk til den får plass. Bilder kan plasseres absolutt med posisjonssyntaks:

```markdown
![alt](url){x=200,y=50,w=150}
```

### HTML-innbygg

`rehype-raw` er aktivert — du kan legge inn rå HTML i Markdown:

```html
<iframe src="https://..."></iframe>
<video src="..."></video>
```

## Presentasjon

- **Utforsk-modus** — klikk en slide for å åpne den utvidet. Naviger med piltastene.
- **Presenter-modus** — lineær gjennomgang i presentasjonsrekkefølge. Stegvis avsløring støttes.
- **Fullskjerm** — trykk `F` i enten modus.

## Eksport

| Modus | Beskrivelse |
|---|---|
| **Selvinneholdt** | Én `.html`-fil med alle bilder inlinet som base64. Fungerer offline. |
| **Kompakt** | `mapwise.html` + separate `mapshow-viewer.js` / `.css`. Lettere fil, krever at de tre filene ligger samlet. |

Eksporterte filer kan importeres tilbake i editoren.

## Kjøring

Krever Node 20+ (utviklet med Node 24). pnpm via Corepack:

```bash
corepack pnpm install
corepack pnpm dev          # http://localhost:5173
corepack pnpm build
corepack pnpm build:viewer # bygg viewer-bundle separat
```

## Hurtigtaster

### Kart-editor

| Tast | Handling |
|---|---|
| `V` | Velg / flytt |
| `S` | Ny slide-boks |
| `T` | Nytt tekstnotat |
| `I` | Ny bildenode |
| `A` | Pilmodus |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Angre / gjør om |
| `Delete` / `Backspace` | Slett valgte |
| `Escape` | Tilbake til velg-modus |
| `?` | Hurtigtastoversikt |
| `Shift`+dra | Endre størrelse fra nærmeste hjørne |
| `Ctrl+V` | Lim inn bilde fra utklippstavle → ny bildenode |

### Presentasjonsmodus

| Tast | Handling |
|---|---|
| `→` / `Space` | Neste steg / slide |
| `←` | Forrige steg / slide |
| `F` | Fullskjerm |
| `Escape` | Tilbake til kart |

### Editor (rediger slide)

| Tast | Handling |
|---|---|
| `Ctrl+K` | Sett inn lenke |
| `Ctrl+V` | Lim inn bilde fra utklippstavle |

## Stack

`React 19` · `Vite 6` · `TypeScript` · `@xyflow/react v12` · `react-markdown` + `remark-gfm` + `rehype-raw` · `gray-matter` · `Tailwind v4` · `useReducer` + Context
