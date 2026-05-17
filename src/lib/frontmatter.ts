import yaml from "js-yaml";

export interface ParsedFrontmatter {
  slide: number | null;
  thumbnail: string | null;
  summary: string | null;
  body: string;
}

// Vi bruker js-yaml direkte i stedet for gray-matter. gray-matter bundler
// inn flere Node-spesifikke avhengigheter (kind-of m.fl.) som "fungerer"
// stille feil i nettleseren — parsen mislyktes uten å kaste, og badge/preview
// viste alltid tomt. js-yaml er plattformuavhengig og dekker fortsatt
// YAML-edge-cases (kolon-i-streng, sitater, innrykk).

// Matcher en YAML-frontmatter-blokk øverst i dokumentet:
//   ---
//   key: value
//   ---
// Tar høyde for både \n og \r\n linjeskift.
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function parseFrontmatter(markdown: string): ParsedFrontmatter {
  const match = FRONTMATTER_RE.exec(markdown);
  if (!match) {
    return { slide: null, thumbnail: null, summary: null, body: markdown };
  }

  let data: Record<string, unknown> = {};
  try {
    const parsed = yaml.load(match[1]);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      data = parsed as Record<string, unknown>;
    }
  } catch {
    // Ugyldig YAML: la som om frontmatter ikke finnes — vis hele teksten som body.
    return { slide: null, thumbnail: null, summary: null, body: markdown };
  }

  const body = markdown.slice(match[0].length);

  const rawSlide = data.slide;
  const slide =
    typeof rawSlide === "number" && Number.isFinite(rawSlide)
      ? rawSlide
      : typeof rawSlide === "string" &&
          rawSlide.trim() !== "" &&
          !Number.isNaN(Number(rawSlide))
        ? Number(rawSlide)
        : null;

  const rawThumb = data.thumbnail;
  const thumbnail =
    typeof rawThumb === "string" && rawThumb.trim() !== ""
      ? rawThumb
      : typeof rawThumb === "number"
        ? String(rawThumb)
        : null;

  const rawSummary = data.summary;
  const summary =
    typeof rawSummary === "string" && rawSummary.trim() !== ""
      ? rawSummary
      : typeof rawSummary === "number"
        ? String(rawSummary)
        : null;

  return { slide, thumbnail, summary, body };
}
