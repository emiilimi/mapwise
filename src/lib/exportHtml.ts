import { FILE_VERSION, type MapShowFile } from "../types";
import type { MapState } from "../state/reducer";

// `</` i en JSON-streng kan ellers avslutte <script>-blokken som omkranser
// dataen. Vi escaper det til `<\/` slik HTML-spec sier.
function safeJson(file: MapShowFile): string {
  return JSON.stringify(file).replace(/<\//g, "<\\/");
}

function stateToFile(state: MapState): MapShowFile {
  return {
    version: state.version ?? FILE_VERSION,
    settings: state.settings,
    nodes: state.nodes,
    edges: state.edges,
  };
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Klarte ikke å hente ${url} (${res.status}). ` +
        `Har du kjørt 'pnpm build:viewer'?`,
    );
  }
  return res.text();
}

interface ViewerAssets {
  js: string;
  css: string;
}

async function loadViewerAssets(): Promise<ViewerAssets> {
  const [js, css] = await Promise.all([
    fetchText("/mapshow-viewer.js"),
    fetchText("/mapshow-viewer.css"),
  ]);
  return { js, css };
}

const BASE_STYLE = `html,body{margin:0;height:100%;overflow:hidden;font-family:system-ui,sans-serif}`;

export interface ExportResult {
  files: { name: string; blob: Blob }[];
}

export async function exportSelfContained(
  state: MapState,
): Promise<ExportResult> {
  const file = stateToFile(state);
  const { js, css } = await loadViewerAssets();
  const html = `<!doctype html>
<html lang="nb">
<head>
<meta charset="utf-8">
<title>MapShow</title>
<style>${BASE_STYLE}</style>
<style>${css}</style>
</head>
<body>
<div id="root"></div>
<script type="application/json" id="mapshow-data">${safeJson(file)}</script>
<script>${js}</script>
</body>
</html>`;
  return {
    files: [
      { name: "mapshow.html", blob: new Blob([html], { type: "text/html" }) },
    ],
  };
}

export async function exportCompact(state: MapState): Promise<ExportResult> {
  const file = stateToFile(state);
  const { js, css } = await loadViewerAssets();
  const html = `<!doctype html>
<html lang="nb">
<head>
<meta charset="utf-8">
<title>MapShow</title>
<style>${BASE_STYLE}</style>
<link rel="stylesheet" href="mapshow-viewer.css">
</head>
<body>
<div id="root"></div>
<script type="application/json" id="mapshow-data">${safeJson(file)}</script>
<script src="mapshow-viewer.js"></script>
</body>
</html>`;
  return {
    files: [
      { name: "mapshow.html", blob: new Blob([html], { type: "text/html" }) },
      {
        name: "mapshow-viewer.js",
        blob: new Blob([js], { type: "application/javascript" }),
      },
      {
        name: "mapshow-viewer.css",
        blob: new Blob([css], { type: "text/css" }),
      },
    ],
  };
}

// Trigger nedlasting via skjult <a download>. Sekvensiell — ikke parallell —
// fordi noen nettlesere strupes hvis flere downloads fyres i samme tick.
export function downloadFiles(files: ExportResult["files"]) {
  for (const { name, blob } of files) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Frigjør URL etter en kort delay — Chrome trenger den til klikket
    // har startet nedlastingen.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
