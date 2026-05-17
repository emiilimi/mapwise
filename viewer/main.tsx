// Belt-and-suspenders: noen avhengigheter sjekker `process` direkte (ikke
// bare `process.env.NODE_ENV`). Vite's define dekker det første, denne
// stubben dekker det andre. Må kjøre før noen andre import-er evalueres.
declare global {
  // eslint-disable-next-line no-var
  var process: { env: Record<string, string | undefined> } | undefined;
}
if (typeof globalThis.process === "undefined") {
  globalThis.process = { env: { NODE_ENV: "production" } };
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ViewerApp } from "./ViewerApp";
import { DEFAULT_SETTINGS, FILE_VERSION, type MapShowFile } from "../src/types";
import type { MapState } from "../src/state/reducer";
import "../src/styles.css";

// Entry-point for mapshow-viewer.js. Leser <script id="mapshow-data">
// fra verts-HTML, parser JSON, og monterer presentasjons-appen i full
// høyde. Hvis dataen mangler eller er ugyldig vises en feilmelding.

function loadFile(): MapState {
  const el = document.getElementById("mapshow-data");
  if (!el) throw new Error("Mangler <script id=\"mapshow-data\">");
  const raw = el.textContent ?? "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Ugyldig JSON i mapshow-data");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("mapshow-data er ikke et objekt");
  }
  const f = parsed as Partial<MapShowFile>;
  return {
    version: typeof f.version === "string" ? f.version : FILE_VERSION,
    settings: { ...DEFAULT_SETTINGS, ...(f.settings ?? {}) },
    nodes: Array.isArray(f.nodes) ? f.nodes : [],
    edges: Array.isArray(f.edges) ? f.edges : [],
  };
}

const rootEl = document.getElementById("root") ?? document.body;
// Sørg for at containeren tar hele viewporten.
Object.assign(rootEl.style, {
  position: "fixed",
  inset: "0",
  margin: "0",
});

try {
  const initial = loadFile();
  createRoot(rootEl).render(
    <StrictMode>
      <ViewerApp initial={initial} />
    </StrictMode>,
  );
} catch (err) {
  rootEl.textContent = "MapShow-viewer: " + (err as Error).message;
}
