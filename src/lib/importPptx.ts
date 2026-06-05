import JSZip from "jszip";
import { DEFAULT_SETTINGS, FILE_VERSION, type MapWiseFile, type SlideNode } from "../types";
import { newId } from "./id";

// In-browser PPTX-import. Pakker ut OOXML-zip-en med JSZip og trekker ut tekst
// (tittel + avsnitt) og innebygde bilder per lysbilde. Resultatet er
// *redigerbare* markdown-slides — ikke pikseltro gjengivelse. Slidene legges i
// `tray` (uplassert); brukeren drar dem ut på kartet.

const R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

class PptxError extends Error {}

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
): Promise<string[]> {
  // slidePath: "ppt/slides/slideN.xml" → rels: "ppt/slides/_rels/slideN.xml.rels"
  const dir = slidePath.slice(0, slidePath.lastIndexOf("/") + 1);
  const name = slidePath.slice(slidePath.lastIndexOf("/") + 1);
  const relsPath = `${dir}_rels/${name}.rels`;
  const relsFile = zip.file(relsPath);
  if (!relsFile) return [];
  const rels = parseRels(await relsFile.async("text"), dir);

  const slideDoc = parseXml(await zip.file(slidePath)!.async("text"));
  const dataUris: string[] = [];
  for (const blip of Array.from(slideDoc.getElementsByTagNameNS("*", "blip"))) {
    const rid = relAttr(blip, "embed");
    if (!rid) continue;
    const mediaPath = rels.get(rid);
    if (!mediaPath) continue;
    const ext = mediaPath.slice(mediaPath.lastIndexOf(".") + 1).toLowerCase();
    const mime = MIME_BY_EXT[ext];
    if (!mime) continue; // emf/wmf/tiff o.l. kan ikke vises i nettleser — hopp over
    const mediaFile = zip.file(mediaPath);
    if (!mediaFile) continue;
    const b64 = await mediaFile.async("base64");
    dataUris.push(`data:${mime};base64,${b64}`);
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

export async function importFromPptx(buf: ArrayBuffer): Promise<MapWiseFile> {
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

  const width = 320;
  const height = Math.max(80, Math.round(width * heightRatio));
  const tray: SlideNode[] = [];
  let slideNo = 0;
  for (const rid of orderedRids) {
    const slidePath = presRels.get(rid);
    if (!slidePath) continue;
    const slideFile = zip.file(slidePath);
    if (!slideFile) continue;
    slideNo += 1;
    const slideDoc = parseXml(await slideFile.async("text"));
    const content = parseSlideText(slideDoc);
    const images = await slideImages(zip, slidePath);
    tray.push({
      type: "slide",
      id: newId(),
      position: { x: 0, y: 0 },
      size: { width, height },
      markdown: buildMarkdown(slideNo, content, images),
    });
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
