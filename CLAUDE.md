# CLAUDE.md — MapWise

Nøkkelopplysninger for fremtidige Claude-økter på dette prosjektet. Holdes kort og oppdatert.

## Hva er dette

**MapWise** (UI-navn: **MapShow**) er en React + Vite-webapp: en kombinert tankekart- og presentasjonsapp. Brukeren bygger et kart av "slide-bokser" (Markdown-noder med YAML frontmatter) koblet med piler, og kartet kan eksporteres som én selvinneholdt HTML-fil som åpnes i nettleseren. Samme HTML-fil kan lastes tilbake inn i editoren.

## Stack

| Tema | Valg |
|---|---|
| Pakke-manager | pnpm (kjør via `corepack pnpm <kmd>` — pnpm-shim ikke installert globalt) |
| Node | v24.14.0 |
| Bygger | Vite 6 |
| UI | React 19 + TypeScript |
| Canvas | `@xyflow/react` v12 (IKKE den eldre `reactflow`-pakken) |
| Styling | Tailwind v4 + `@tailwindcss/vite` (ingen `tailwind.config.js`) |
| Markdown | `react-markdown` + `remark-gfm` + `gray-matter` (frontmatter) |
| State | `useReducer` + Context (IKKE Zustand) |
| Lint/format | ESLint flat-config + Prettier (standard) |
| Git | Direkte på `main`, lokale commits per steg, ingen push (med mindre brukeren ber om det) |

## Arkitekturvalg

- **Én commit per implementeringssteg** (se planen i `~/.claude/plans/`).
- **Undo/redo**: `past[]/future[]`-stack i `src/state/history.ts`, maks 100 steg. Drag-merge for MOVE_NODE innen 500 ms for å unngå én undo-frame per piksel.
- **Hurtigtaster**: må alltid sjekke `document.activeElement` — Ctrl+Z i textarea går til nettleseren, ikke appen.
- **Frontmatter**: leses ut av `markdown`-strengen ved render (med `useMemo`), lagres aldri separat i datamodellen.
- **Editor i node-modal**: `<textarea>` med monospace + live frontmatter-preview-linje. CodeMirror = TODO.

## Datamodell (kjerne)

```ts
interface MapShowFile {
  version: string;
  settings: MapSettings;          // zoomThreshold, clickBehavior, canvasBackground
  nodes: (SlideNode | TextNode)[];
  edges: Arrow[];
}
interface SlideNode { type: "slide"; id; position; size; markdown }
interface TextNode  { type: "text";  id; position; content }
interface Arrow     { id; from; to }
```

## Scope-status

Steg 1–9 er gjeldende leveranse (kartredigering). Eksplisitt utsatt:
- Steg 10–11: utforsk-modus + presenter-modus
- Steg 12: eksport (3 modi: selvinneholdt / kompakt / CDN) + import via `<script id="mapshow-data">`
- Egen Vite-entry `viewer/main.tsx` → `mapshow-viewer.js`
- Base64-bildeembedding, flere pilstiler, L/B-noder, Framer Motion, CodeMirror, speaker notes

## Kjøring

```bash
corepack pnpm install
corepack pnpm dev      # http://localhost:5173
corepack pnpm build
corepack pnpm lint
corepack pnpm format
```
