import { DEFAULT_SETTINGS, FILE_VERSION, type MapWiseFile } from "../types";

// Autolagring i localStorage så et refresh/krasj ikke sletter arbeidet.
// Eksport til HTML er fortsatt den varige lagringen — localStorage er
// per-nettleser og har ~5 MB kvote (store base64-kart kan overstige den;
// da logger vi en advarsel i stedet for å krasje).

const KEY = "mapwise:autosave:v1";

let warnedQuota = false;

export function saveMap(file: MapWiseFile): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(file));
  } catch (err) {
    if (!warnedQuota) {
      warnedQuota = true;
      console.warn(
        "[MapWise] Autolagring feilet (sannsynligvis localStorage-kvote). " +
          "Eksporter til HTML for å sikre arbeidet.",
        err,
      );
    }
  }
}

export function loadMap(): MapWiseFile | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const f = JSON.parse(raw) as Partial<MapWiseFile>;
    if (!Array.isArray(f.nodes) || !Array.isArray(f.edges)) return null;
    return {
      version: typeof f.version === "string" ? f.version : FILE_VERSION,
      settings: { ...DEFAULT_SETTINGS, ...(f.settings ?? {}) },
      nodes: f.nodes,
      edges: f.edges,
      tray: Array.isArray(f.tray) ? f.tray : [],
    };
  } catch {
    return null;
  }
}

// Finnes det en autolagring i det hele tatt? (Skiller «ny bruker» fra
// «bruker med bevisst tomt kart».)
export function hasAutosave(): boolean {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}
