import JSZip from "jszip";
import { DEFAULT_SETTINGS, FILE_VERSION, type MapWiseFile, type SlideNode } from "../types";
import { newId } from "./id";

// In-browser PPTX-import. Pakker ut OOXML-zip-en med JSZip og trekker ut tekst
// (tittel + avsnitt) og innebygde bilder per lysbilde. Resultatet er
// *redigerbare* markdown-slides — ikke pikseltro gjengivelse. Slidene legges i
// `tray` (uplassert); brukeren drar dem ut på kartet.
//
// Bilder nedskaleres og rekomprimeres ved import (maks 1600 px, JPEG/PNG).
// Uten dette blir base64-markdown for store deck titalls MB og fryser
// rendringen. Identiske media-filer deles på tvers av slides via cache.

const R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

// Maks bildedimensjon etter import. 1600 px holder for fullskjerm-visning.
const MAX_IMAGE_DIM = 1600;
const JPEG_QUALITY = 0.82;

class PptxError extends Error {}

export type PptxProgress = (done: number, total: number) => void;

function parseXml(xml: string): Document {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) {
    throw new PptxError("Kunne ikke tolke XML i PPTX-filen.");
  }
  return doc;
}

// Hent r:id / r:embed-attributtet uavhengig av om parseren er namespace-aware.
function relAttr(el: Element, local: "id" | "embed"): string | null {
  return el.getAttributeNS(R_NS, local) ?? el.getAttribute(`r:${local}`);
}

// Løs en relativ OOXML-sti mot en base-mappe (som alltid slutter med "/").
function resolvePath(baseDir: string, target: string): string {
  if (target.startsWith("/")) return target.slice(1);
  const out: string[] = [];
  for (const part of (baseDir + target).split("/")) {
    if (part === "..") out.pop();
    else if (part !== "." && part !== "") out.push(part);
  }
  return out.join("/");
}

// rId → target-sti fra en .rels-fil.
function parseRels(relsXml: string, baseDir: string): Map<string, string> {
  const doc = parseXml(relsXml);
  const map = new Map<string, string>();
  for (const r of Array.from(doc.getElementsByTagNameNS("*", "Relationship"))) {
    const id = r.getAttribute("Id");
    const target = r.getAttribute("Target");
    if (id && target) map.set(id, resolvePath(baseDir, target));
  }
  return map;
}

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  bmp: "image/bmp",
  webp: "image/webp",
  svg: "image/svg+xml",
};

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
}

// Sjekk om bitmapet har (delvis) gjennomsiktige piksler. Sampler hver 8. piksel
// — godt nok til å avgjøre PNG-vs-JPEG, og raskt selv på store bilder.
function hasAlpha(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  const data = ctx.getImageData(0, 0, w, h).data;
  for (let i = 3; i < data.length; i += 32) {
    if (data[i] < 255) return true;
  }
  return false;
}

// Nedskaler + rekomprimer ett bilde. Returnerer alltid en data-URI — faller
// tilbake på rå original hvis dekoding/enkoding feiler, og beholder originalen
// hvis den faktisk er mindre enn det rekomprimerte resultatet.
async function compressImage(raw: Blob, mime: string): Promise<string> {
  // SVG er vektor (lite + skalerbart), GIF kan være animert — behold som-er.
  if (mime === "image/svg+xml" || mime === "image/gif") {
    return blobToDataUri(raw);
  }
  try {
    const bitmap = await createImageBitmap(raw);
    const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return blobToDataUri(raw);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    // Transparens må bevares som PNG; ellers gir JPEG langt mindre filer.
    const keepAlpha = mime === "image/png" && hasAlpha(ctx, w, h);
    const out = keepAlpha
      ? await canvasToBlob(canvas, "image/png")
      : await canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY);
    if (!out || out.size >= raw.size) return blobToDataUri(raw);
    return blobToDataUri(out);
  } catch {
    return blobToDataUri(raw);
  }
}

function reduceRatio(cx: number, cy: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const g = gcd(cx, cy) || 1;
  return `${Math.round(cx / g)}:${Math.round(cy / g)}`;
}

function paragraphText(p: Element): string {
  return Array.from(p.getElementsByTagNameNS("*", "t"))
    .map((t) => t.textContent ?? "")
    .join("")
    .trim();
}

interface SlideContent {
  title: string;
  bullets: { text: string; lvl: number }[];
}

function parseSlideText(slideDoc: Document): SlideContent {
  const titleParts: string[] = [];
  const bullets: { text: string; lvl: number }[] = [];

  for (const sp of Array.from(slideDoc.getElementsByTagNameNS("*", "sp"))) {
    const ph = sp.getElementsByTagNameNS("*", "ph")[0];
    const phType = ph?.getAttribute("type") ?? "";
    const isTitle = phType === "title" || phType === "ctrTitle";

    for (const p of Array.from(sp.getElementsByTagNameNS("*", "p"))) {
      const text = paragraphText(p);
      if (!text) continue;
      if (isTitle) {
        titleParts.push(text);
      } else {
        const pPr = p.getElementsByTagNameNS("*", "pPr")[0];
        const lvl = parseInt(pPr?.getAttribute("lvl") ?? "0", 10) || 0;
        bullets.push({ text, lvl });
      }
    }
  }

  return { title: titleParts.join(" "), bullets };
}

async function slideImages(
  zip: JSZip,
  slidePath: string,
  slideDoc: Document,
  mediaCache: Map<string, Promise<string | null>>,
): Promise<string[]> {
  // slidePath: "ppt/slides/slideN.xml" → rels: "ppt/slides/_rels/slideN.xml.rels"
  const dir = slidePath.slice(0, slidePath.lastIndexOf("/") + 1);
  const name = slidePath.slice(slidePath.lastIndexOf("/") + 1);
  const relsPath = `${dir}_rels/${name}.rels`;
  const relsFile = zip.file(relsPath);
  if (!relsFile) return [];
  const rels = parseRels(await relsFile.async("text"), dir);

  const dataUris: string[] = [];
  const seenInSlide = new Set<string>();
  for (const blip of Array.from(slideDoc.getElementsByTagNameNS("*", "blip"))) {
    const rid = relAttr(blip, "embed");
    if (!rid) continue;
    const mediaPath = rels.get(rid);
    if (!mediaPath || seenInSlide.has(mediaPath)) continue;
    seenInSlide.add(mediaPath);

    // Cache per media-fil: samme bilde gjenbrukt på flere slides komprimeres
    // bare én gang, og data-URI-strengen deles (samme JS-streng i minnet).
    let promise = mediaCache.get(mediaPath);
    if (!promise) {
      promise = (async () => {
        const ext = mediaPath.slice(mediaPath.lastIndexOf(".") + 1).toLowerCase();
        const mime = MIME_BY_EXT[ext];
        if (!mime) return null; // emf/wmf/tiff o.l. kan ikke vises i nettleser
        const mediaFile = zip.file(mediaPath);
        if (!mediaFile) return null;
        const raw = await mediaFile.async("blob");
        return compressImage(raw.type ? raw : raw.slice(0, raw.size, mime), mime);
      })();
      mediaCache.set(mediaPath, promise);
    }
    const uri = await promise;
    if (uri) dataUris.push(uri);
  }
  return dataUris;
}

function buildMarkdown(
  slideNo: number,
  content: SlideContent,
  images: string[],
): string {
  const title = content.title.trim();
  const thumbnail = title || `Slide ${slideNo}`;
  const lines: string[] = [
    "---",
    `slide: ${slideNo}`,
    `thumbnail: ${JSON.stringify(thumbnail)}`,
    "---",
    "",
  ];
  if (title) {
    lines.push(`# ${title}`, "");
  }
  for (const b of content.bullets) {
    lines.push(`${"  ".repeat(b.lvl)}- ${b.text}`);
  }
  if (content.bullets.length > 0) lines.push("");
  for (const uri of images) {
    lines.push(`![](${uri})`, "");
  }
  return lines.join("\n").trimEnd() + "\n";
}

export async function importFromPptx(
  buf: ArrayBuffer,
  onProgress?: PptxProgress,
): Promise<MapWiseFile> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buf);
  } catch {
    throw new PptxError("Filen ser ikke ut som en gyldig .pptx (zip).");
  }

  const presFile = zip.file("ppt/presentation.xml");
  if (!presFile) throw new PptxError("Mangler ppt/presentation.xml — er dette en PowerPoint-fil?");
  const presDoc = parseXml(await presFile.async("text"));

  // Aspect fra slide-størrelsen (EMU).
  let aspectRatio = DEFAULT_SETTINGS.aspectRatio;
  let heightRatio = 9 / 16;
  const sldSz = presDoc.getElementsByTagNameNS("*", "sldSz")[0];
  if (sldSz) {
    const cx = parseInt(sldSz.getAttribute("cx") ?? "0", 10);
    const cy = parseInt(sldSz.getAttribute("cy") ?? "0", 10);
    if (cx > 0 && cy > 0) {
      aspectRatio = reduceRatio(cx, cy);
      heightRatio = cy / cx;
    }
  }

  // Rekkefølge: sldIdLst → r:id → presentation.xml.rels → slide-sti.
  const presRelsFile = zip.file("ppt/_rels/presentation.xml.rels");
  if (!presRelsFile) throw new PptxError("Mangler presentation.xml.rels.");
  const presRels = parseRels(await presRelsFile.async("text"), "ppt/");

  const orderedRids = Array.from(presDoc.getElementsByTagNameNS("*", "sldId"))
    .map((s) => relAttr(s, "id"))
    .filter((x): x is string => !!x);
  const slidePaths = orderedRids
    .map((rid) => presRels.get(rid))
    .filter((p): p is string => !!p && !!zip.file(p));

  const width = 320;
  const height = Math.max(80, Math.round(width * heightRatio));
  const tray: SlideNode[] = [];
  const mediaCache = new Map<string, Promise<string | null>>();

  onProgress?.(0, slidePaths.length);
  for (const [i, slidePath] of slidePaths.entries()) {
    const slideDoc = parseXml(await zip.file(slidePath)!.async("text"));
    const content = parseSlideText(slideDoc);
    const images = await slideImages(zip, slidePath, slideDoc, mediaCache);
    tray.push({
      type: "slide",
      id: newId(),
      position: { x: 0, y: 0 },
      size: { width, height },
      markdown: buildMarkdown(i + 1, content, images),
    });
    onProgress?.(i + 1, slidePaths.length);
  }

  if (tray.length === 0) {
    throw new PptxError("Fant ingen lysbilder i presentasjonen.");
  }

  return {
    version: FILE_VERSION,
    settings: { ...DEFAULT_SETTINGS, fixedForm: true, aspectRatio },
    nodes: [],
    edges: [],
    tray,
  };
}
