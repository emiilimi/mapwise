import { FILE_VERSION, type MapWiseFile, type ImageNode } from "../types";
import type { MapState } from "../state/reducer";

// `</` i en JSON-streng kan ellers avslutte <script>-blokken som omkranser
// dataen. Vi escaper det til `<\/` slik HTML-spec sier.
function safeJson(file: MapWiseFile): string {
  return JSON.stringify(file).replace(/<\//g, "<\\/");
}

function stateToFile(state: MapState): MapWiseFile {
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

// Regex som finner markdown-bildereferanser: ![alt](url)
const MD_IMG_RE = /!\[[^\]]*\]\(((?!data:)[^)]+)\)/g;

async function urlToDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn(`[MapWise export] Klarte ikke å inline bilde: ${url}`, err);
    return null;
  }
}

async function inlineImages(file: MapWiseFile): Promise<MapWiseFile> {
  // Samle alle unike eksterne URL-er fra markdown og ImageNode.src.
  const urlSet = new Set<string>();

  for (const node of file.nodes) {
    if (node.type === "slide") {
      for (const m of node.markdown.matchAll(MD_IMG_RE)) {
        urlSet.add(m[1]);
      }
    } else if (node.type === "image" && !node.src.startsWith("data:")) {
      urlSet.add(node.src);
    }
  }

  if (urlSet.size === 0) return file;

  // Fetch alle i parallell.
  const entries = await Promise.all(
    [...urlSet].map(async (url) => [url, await urlToDataUri(url)] as const),
  );
  const map = new Map(entries.filter(([, v]) => v !== null) as [string, string][]);

  if (map.size === 0) return file;

  // Erstatt i kopi av file.
  const nodes = file.nodes.map((node) => {
    if (node.type === "slide") {
      const newMarkdown = node.markdown.replace(
        MD_IMG_RE,
        (match, url) => map.has(url) ? match.replace(url, map.get(url)!) : match,
      );
      return newMarkdown === node.markdown ? node : { ...node, markdown: newMarkdown };
    }
    if (node.type === "image" && map.has(node.src)) {
      return { ...node, src: map.get(node.src)! } satisfies ImageNode;
    }
    return node;
  });

  return { ...file, nodes };
}

export interface ExportResult {
  files: { name: string; blob: Blob }[];
}

export async function exportSelfContained(
  state: MapState,
): Promise<ExportResult> {
  const [file, { js, css }] = await Promise.all([
    inlineImages(stateToFile(state)),
    loadViewerAssets(),
  ]);
  const html = `<!doctype html>
<html lang="nb">
<head>
<meta charset="utf-8">
<title>MapWise</title>
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
<title>MapWise</title>
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
