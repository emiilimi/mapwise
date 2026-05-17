import { parseFrontmatter } from "../lib/frontmatter";
import type { MapState } from "../state/reducer";
import type { SlideNode } from "../types";

export interface OrderedSlide {
  node: SlideNode;
  slide: number;
  thumbnail: string | null;
  summary: string | null;
  body: string;
}

// Henter slide-noder med gyldig `slide:`-felt og sorterer numerisk.
// Noder uten slide-tall hopper vi over (de er bare deler av kartet, ikke
// del av presentasjonsrekkefølgen).
export function getOrderedSlides(map: MapState): OrderedSlide[] {
  const out: OrderedSlide[] = [];
  for (const n of map.nodes) {
    if (n.type !== "slide") continue;
    const { slide, thumbnail, summary, body } = parseFrontmatter(n.markdown);
    if (slide === null) continue;
    out.push({ node: n, slide, thumbnail, summary, body });
  }
  out.sort((a, b) => a.slide - b.slide);
  return out;
}
