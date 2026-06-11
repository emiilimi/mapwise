# CLAUDE.md — MapWise

Nøkkelopplysninger for fremtidige Claude-økter på dette prosjektet. Holdes kort og oppdatert.

## Hva er dette

**MapWise** (UI-navn: **MapShow**) er en React + Vite-webapp: en kombinert tankekart- og presentasjonsapp. Brukeren bygger et kart av slide-bokser (Markdown med YAML frontmatter), tekstnotater og bildenoder koblet med piler. Kartet kan presenteres (utforsk- og presenter-modus), eksporteres som én selvinneholdt HTML-fil, og importeres tilbake. PowerPoint-filer (.pptx) kan importeres som redigerbare slides. Publiseres på GitHub Pages (mapwise.emoldestad.no) via `.github/workflows/deploy.yml`.

## Stack

| Tema | Valg |
|---|---|
| Pakke-manager | pnpm (kjør via `corepack pnpm <kmd>` — pnpm-shim ikke installert globalt) |
| Node | v24 |
| Bygger | Vite 6 — to bygg: editor (`vite.config.ts`) og viewer-IIFE (`vite.viewer.config.ts` → `public/mapshow-viewer.js`) |
| UI | React 19 + TypeScript |
| Canvas | `@xyflow/react` v12 (IKKE den eldre `reactflow`-pakken) |
| Styling | Tailwind v4 + `@tailwindcss/vite` (ingen `tailwind.config.js`) |
| Markdown | `react-markdown` + `remark-gfm` + `rehype-raw`, frontmatter via `js-yaml` (IKKE gray-matter) |
| PPTX-import | `jszip` (lastes dynamisk — skal IKKE importeres statisk i hovedbundelen) |
| State | `useReducer` + Context (IKKE Zustand) |
| Lint/format | ESLint flat-config + Prettier (standard) |
| Git | Direkte på `main`, lokale commits per steg, ingen push (med mindre brukeren ber om det) |

## Arkitekturvalg

- **All markdown rendres via `SafeMarkdown`** (`src/lib/SafeMarkdown.tsx`): felles plugins, `urlTransform` som tillater `data:image/`-URI-er, og error-boundary. Ikke bruk `ReactMarkdown` direkte.
- **Undo/redo**: `past[]/future[]` i `src/state/history.ts`, maks 100 steg. Drag-merge for MOVE/RESIZE/TRANSFORM innen 500 ms.
- **Autosave**: debounced til localStorage (`src/lib/autosave.ts`, nøkkel `mapwise:autosave:v1`). Oppstart gjenoppretter via `initial` på StoreProvider (ingen boot-undo-frame).
- **Frontmatter**: leses ut av `markdown`-strengen ved render (med `useMemo`), lagres aldri separat. `setSlideNumber` skriver om `slide:`-feltet ved omrokkering.
- **Hurtigtaster**: V/S/T/P (pil)/B (bilde) i `useKeyboard.ts` — sjekker alltid `document.activeElement`. Hjelp-modal og README må holdes i sync med `TOOL_KEYS`.
- **PPTX-import** (`src/lib/importPptx.ts`): bilder nedskaleres (maks 1600 px) og rekomprimeres (JPEG/PNG), media deles via cache, slides havner i `tray`.
- **Sidebar** (`src/sidebar/SlidePanel.tsx`): viser plasserte + tray-slides i `slide:`-rekkefølge, drag-reorder → `REORDER_SLIDES`, dra ut på kartet → `PLACE_FROM_TRAY`.

## Datamodell (kjerne)

```ts
interface MapWiseFile {
  version: string;
  settings: MapSettings;   // zoomThreshold, clickBehavior, fixedForm, aspectRatio, …
  nodes: AnyNode[];        // SlideNode | TextNode | ImageNode
  edges: Arrow[];
  tray?: SlideNode[];      // uplasserte slides (pptx-import)
}
interface SlideNode { type: "slide"; id; position; size; markdown }
interface TextNode  { type: "text";  id; position; size?; content }
interface ImageNode { type: "image"; id; position; size; src; alt?; slide?; thumbnail?; sourceName?; sourceUrl? }
interface Arrow     { id; from; to }
```

## Kjøring

```bash
corepack pnpm install
corepack pnpm dev      # http://localhost:5173
corepack pnpm build    # bygger viewer + editor (tsc -b inkludert)
corepack pnpm lint
corepack pnpm format
```
