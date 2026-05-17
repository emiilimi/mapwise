import matter from "gray-matter";

export interface ParsedFrontmatter {
  slide: number | null;
  thumbnail: string | null;
  body: string;
}

// gray-matter er Node-targeted og bruker Buffer i input-checks. Vi gir den
// alltid en streng, så det går fint i nettleseren. YAML-parsingen i seg selv
// (js-yaml) er plattformuavhengig og takler kolon-i-tekst, sitater og innrykk
// som vi ellers måtte løse med en egen parser.

export function parseFrontmatter(markdown: string): ParsedFrontmatter {
  let data: Record<string, unknown> = {};
  let body = markdown;
  try {
    const parsed = matter(markdown);
    data = parsed.data as Record<string, unknown>;
    body = parsed.content;
  } catch {
    // Ugyldig YAML: behold rå markdown, ingen frontmatter.
  }

  const rawSlide = data.slide;
  const slide =
    typeof rawSlide === "number" && Number.isFinite(rawSlide)
      ? rawSlide
      : typeof rawSlide === "string" && rawSlide.trim() !== "" && !Number.isNaN(Number(rawSlide))
        ? Number(rawSlide)
        : null;

  const rawThumb = data.thumbnail;
  const thumbnail =
    typeof rawThumb === "string" && rawThumb.trim() !== ""
      ? rawThumb
      : typeof rawThumb === "number"
        ? String(rawThumb)
        : null;

  return { slide, thumbnail, body };
}
