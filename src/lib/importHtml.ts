import { DEFAULT_SETTINGS, FILE_VERSION, type MapWiseFile } from "../types";

// Henter ut JSON-blokken fra en eksportert MapWise-HTML. Vi parser ikke
// hele HTML-dokumentet — en regex på script-tagene er entydig nok så lenge
// id-attributtet er "mapshow-data".
const DATA_RE =
  /<script[^>]*id=["']mapshow-data["'][^>]*>([\s\S]*?)<\/script>/i;

export class ImportError extends Error {}

export async function importFromHtml(html: string): Promise<MapWiseFile> {
  const match = DATA_RE.exec(html);
  if (!match) {
    throw new ImportError("Fant ikke <script id=\"mapshow-data\"> i filen.");
  }
  // Reverser <\/ -> </ (vi escaper det ved eksport).
  const raw = match[1].replace(/<\\\//g, "</").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ImportError("Ugyldig JSON i mapshow-data.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new ImportError("mapshow-data er ikke et objekt.");
  }
  const f = parsed as Partial<MapWiseFile>;
  if (!Array.isArray(f.nodes) || !Array.isArray(f.edges)) {
    throw new ImportError("Filen mangler nodes/edges-array.");
  }
  return {
    version: typeof f.version === "string" ? f.version : FILE_VERSION,
    settings: { ...DEFAULT_SETTINGS, ...(f.settings ?? {}) },
    nodes: f.nodes,
    edges: f.edges,
    tray: Array.isArray(f.tray) ? f.tray : [],
  };
}
