# MapWise

> Crossover av Lucidspark og PowerPoint. Bygg et tankekart av "slide-bokser" koblet med piler, og presenter det &mdash; eller eksporter hele greia som &eacute;n selvinneholdt HTML-fil.

Pakke: `mapwise` &middot; App-navn i UI: **MapShow**

## Konsept

- Hvert kart er &eacute;n fil (`.html`). Filen inneholder b&aring;de visningsapp og data.
- Noder er enten **slide-bokser** (Markdown med YAML frontmatter) eller **tekstnotater** (l&oslash;s tekst, ingen ramme).
- `slide:`-feltet i frontmatter bestemmer presentasjonsrekkef&oslash;lge (st&oslash;tter desimaler).
- `thumbnail:`-feltet vises n&aring;r kartet er zoomet ut.
- `---step---` i Markdown-innholdet skiller stegene som avsl&oslash;res &eacute;n om gangen i presenter-modus.
- Presentasjon: kart-modus med pan/zoom, eller line&aelig;r presenter-modus med animert overgang mellom slides.

## Kj&oslash;ring

Krever Node 20+ (utviklet med Node 24). pnpm via Corepack:

```bash
corepack pnpm install
corepack pnpm dev        # http://localhost:5173
corepack pnpm build
```

## Status

Under utvikling. Gjeldende leveranse er **kart-redigering (steg 1&ndash;9)**:

1. Prosjektoppsett (Vite + React + TS + Tailwind v4 + Prettier) &mdash; **i gang**
2. Datamodell og `useReducer`-store med undo/redo
3. React Flow canvas + slide-/tekstnoder
4. Frontmatter-parsing + thumbnail/slide-overlay
5. Verkt&oslash;ylinje + hurtigtaster
6. Dobbeltklikk-editor
7. Pilmodus + h&oslash;yreklikk-meny
8. Zoom-basert thumbnail-bytte
9. Kartinnstillinger-panel

Senere:
- Steg 10&ndash;11: utforsk-modus + presenter-modus
- Steg 12: eksport som selvinneholdt HTML + import

## Stack

`React 19` &middot; `Vite 6` &middot; `TypeScript` &middot; `@xyflow/react v12` &middot; `react-markdown` + `remark-gfm` &middot; `gray-matter` &middot; `Tailwind v4` &middot; `useReducer` + Context

## Hurtigtaster (planlagt)

| Tast | Handling |
|---|---|
| `V` | Velg / flytt |
| `S` | Ny slide-boks |
| `T` | Nytt tekstnotat |
| `P` | Pil-modus |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Angre / gj&oslash;r om |
| `Delete` | Slett valgte |
| `?` | Hurtigtastoversikt |
| `Escape` | Tilbake til velg-modus |
