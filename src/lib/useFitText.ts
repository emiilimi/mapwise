import { useLayoutEffect, type RefObject } from "react";

// Binær-søk-auto-fit: setter font-size på `ref`-elementet så høyt som mulig
// uten at scrollHeight/scrollWidth overstiger client-bounds. Re-kjører ved
// container-resize (ResizeObserver) og når body-strengen endrer seg.
//
// Når disabled: clear inline font-size så CSS-default tar over.
export function useFitText(
  ref: RefObject<HTMLElement | null>,
  body: string,
  enabled: boolean,
  min = 4,
  max = 48,
) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!enabled) {
      el.style.removeProperty("font-size");
      return;
    }

    function fit() {
      const el = ref.current;
      if (!el) return;
      let lo = min;
      let hi = max;
      let best = lo;
      // Loop-grense som sikkerhetsnett. log2(48)~5.5, 20 holder med god margin.
      for (let i = 0; i < 20 && lo <= hi; i++) {
        const mid = Math.floor((lo + hi) / 2);
        el.style.fontSize = mid + "px";
        const fits =
          el.scrollHeight <= el.clientHeight &&
          el.scrollWidth <= el.clientWidth;
        if (fits) {
          best = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      el.style.fontSize = best + "px";
    }

    fit();
    const ro = new ResizeObserver(() => fit());
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, body, enabled, min, max]);
}
