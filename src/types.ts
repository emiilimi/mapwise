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
}

export const FILE_VERSION = "0.1.0";

export const DEFAULT_SETTINGS: MapSettings = {
  zoomThreshold: 0.5,
  clickBehavior: "expand",
  canvasBackground: "#f5f5f5",
};

export const DEFAULT_SLIDE_SIZE = { width: 320, height: 200 };

export const DEFAULT_SLIDE_MARKDOWN = `---
slide: 1
thumbnail: Ny slide
---

# Overskrift

Skriv innhold her.
`;
