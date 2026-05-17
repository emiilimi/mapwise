// MapShow datamodell. Lagres til disk i denne formen (én fil per kart).
// Frontmatter (slide, thumbnail) er en del av markdown-strengen — ikke et eget felt.

export interface MapShowFile {
  version: string;
  settings: MapSettings;
  nodes: AnyNode[];
  edges: Arrow[];
}

export type AnyNode = SlideNode | TextNode;

export interface SlideNode {
  type: "slide";
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  markdown: string;
}

export interface TextNode {
  type: "text";
  id: string;
  position: { x: number; y: number };
  content: string;
}

export interface Arrow {
  id: string;
  from: string;
  to: string;
}

export interface MapSettings {
  zoomThreshold: number;
  clickBehavior: "expand" | "fullscreen";
  canvasBackground: string;
  // Oppsummering vises alltid på kartet når innholdet ikke får plass. I
  // presentasjons-modusene (utforsk + presenter) er den skjult som default,
  // men kan slås på her.
  showSummaryInPresent: boolean;
  summaryPosition: "top" | "bottom";
  // Kart-stil. Fast form = alle slides har samme sideforhold (aspectRatio);
  // tekst auto-fittes til å få plass. Fri form = fri størrelse, overflow klippes.
  fixedForm: boolean;
  aspectRatio: string; // f.eks. "16:9", "4:3", "1:1"
  // Bare aktiv når fixedForm=false: boksen utvides automatisk i høyden for
  // å romme innholdet.
  containMode: boolean;
}

export const FILE_VERSION = "0.1.0";

export const DEFAULT_SETTINGS: MapSettings = {
  zoomThreshold: 0.5,
  clickBehavior: "expand",
  canvasBackground: "#f5f5f5",
  showSummaryInPresent: false,
  summaryPosition: "bottom",
  fixedForm: false,
  aspectRatio: "16:9",
  containMode: false,
};

// Parser "16:9" til numerisk forhold. Returnerer null for ugyldig input.
export function parseAspectRatio(s: string): number | null {
  const m = /^\s*(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)\s*$/.exec(s);
  if (!m) return null;
  const w = Number(m[1]);
  const h = Number(m[2]);
  if (!Number.isFinite(w) || !Number.isFinite(h) || h === 0) return null;
  return w / h;
}

export const DEFAULT_SLIDE_SIZE = { width: 320, height: 200 };

export const DEFAULT_SLIDE_MARKDOWN = `---
slide: 1
thumbnail: Ny slide
---

# Overskrift

Skriv innhold her.
`;
