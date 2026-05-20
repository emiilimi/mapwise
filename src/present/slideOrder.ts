import { parseFrontmatter } from "../lib/frontmatter";
import type { MapState } from "../state/reducer";
import type { ImageNode, SlideNode } from "../types";

export interface OrderedSlide {
  node: SlideNode | ImageNode;
  slide: number;
  thumbnail: string | null;
  summary: string | null;
  body: string;
}

// Henter slide-noder og bildenoder med gyldig `slide:`-felt, sorterer numerisk.
export function getOrderedSlides(map: MapState): OrderedSlide[] {
  const out: OrderedSlide[] = [];
  for (const n of map.nodes) {
    if (n.type === "slide") {
      const { slide, thumbnail, summary, body } = parseFrontmatter(n.markdown);
      if (slide === null) continue;
      out.push({ node: n, slide, thumbnail, summary, body });
    } else if (n.type === "image" && n.slide != null) {
      out.push({ node: n, slide: n.slide, thumbnail: n.thumbnail ?? null, summary: null, body: "" });
    }
  }
  out.sort((a, b) => a.slide - b.slide);
  return out;
}
