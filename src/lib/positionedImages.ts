// Posisjons-syntaks for bilder i fixedForm-slides:
//   ![alt](url){x=100,y=50,w=200,h=80}
//
// Tillater absolutt plassering relativt til slide-boksens nominelle
// størrelse. I fri form ignoreres syntaksen og fjernes ved render.

export interface PositionedImage {
  src: string;
  alt: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
}

// `![alt](url){...attrs...}` — `alt` og `attrs` kan inneholde mellomrom.
const REGEX = /!\[([^\]]*)\]\(([^)]+)\)\{([^}]*)\}/g;

export function parsePositionAttrs(s: string): Partial<PositionedImage> {
  const out: Partial<PositionedImage> = {};
  for (const part of s.split(",")) {
    const [k, v] = part.split("=");
    if (!k || !v) continue;
    const key = k.trim();
    const num = parseFloat(v.trim());
    if (!Number.isFinite(num)) continue;
    if (key === "x") out.x = num;
    else if (key === "y") out.y = num;
    else if (key === "w" || key === "width") out.w = num;
    else if (key === "h" || key === "height") out.h = num;
  }
  return out;
}

export interface ExtractResult {
  cleaned: string;
  images: PositionedImage[];
}

// Trekk ut posisjonerte bilder fra markdown. Etterlater en versjon av strengen
// uten posisjons-syntakset, slik at ReactMarkdown ikke rendrer bildene inline.
export function extractPositionedImages(body: string): ExtractResult {
  const images: PositionedImage[] = [];
  const cleaned = body.replace(REGEX, (_, alt: string, src: string, attrs: string) => {
    const parsed = parsePositionAttrs(attrs);
    if (parsed.x === undefined || parsed.y === undefined) {
      // Mangler påkrevde felt — la markdown stå urørt (uten {...}).
      return `![${alt}](${src})`;
    }
    images.push({
      src,
      alt,
      x: parsed.x,
      y: parsed.y,
      w: parsed.w,
      h: parsed.h,
    });
    return "";
  });
  return { cleaned, images };
}

// Bare strip posisjons-suffikset; behold bildet inline. Brukes i fri form.
export function stripPositionSyntax(body: string): string {
  return body.replace(REGEX, (_, alt: string, src: string) => `![${alt}](${src})`);
}
