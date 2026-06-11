import { useEffect, useRef, type RefObject } from "react";
import type { MapAction } from "../state/reducer";

interface Options {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  minWidth: number;
  minHeight: number;
  aspectRatio: number | null;
  dispatch: (action: MapAction) => void;
  enabled?: boolean;
}

const MOVE_THRESHOLD = 3;

export function useShiftResize(
  ref: RefObject<HTMLElement | null>,
  opts: Options,
) {
  const { id, minWidth, minHeight, aspectRatio, dispatch, enabled = true } = opts;

  // Hold gjeldende posisjon/størrelse i en ref slik at effekten ikke re-binder
  // pointer-handleren ved hver dispatch under drag.
  const latest = useRef(opts);
  latest.current = opts;

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    function onPointerDown(e: PointerEvent) {
      if (!e.shiftKey || e.button !== 0) return;
      const target = ref.current;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const cornerX: "L" | "R" = e.clientX - rect.left < rect.width / 2 ? "L" : "R";
      const cornerY: "T" | "B" = e.clientY - rect.top < rect.height / 2 ? "T" : "B";

      const startMx = e.clientX;
      const startMy = e.clientY;
      const startX = latest.current.position.x;
      const startY = latest.current.position.y;
      const startW = latest.current.size.width;
      const startH = latest.current.size.height;
      // Render-skala (zoom): DOM-rect er flow-størrelsen ganget med zoom.
      // Skjerm-deltaer må deles på denne, ellers resizer boksen feil
      // hastighet ved zoom ≠ 1.
      const renderScale = startW > 0 ? rect.width / startW : 1;

      let activated = false;
      let rafId = 0;
      let pendingDx = 0;
      let pendingDy = 0;

      function commit() {
        rafId = 0;
        let w = startW;
        let h = startH;
        let x = startX;
        let y = startY;

        if (cornerX === "R") {
          w = startW + pendingDx;
        } else {
          w = startW - pendingDx;
          x = startX + pendingDx;
        }
        if (cornerY === "B") {
          h = startH + pendingDy;
        } else {
          h = startH - pendingDy;
          y = startY + pendingDy;
        }

        if (w < minWidth) {
          if (cornerX === "L") x -= minWidth - w;
          w = minWidth;
        }
        if (h < minHeight) {
          if (cornerY === "T") y -= minHeight - h;
          h = minHeight;
        }

        if (aspectRatio !== null && aspectRatio > 0) {
          const targetH = Math.round(w / aspectRatio);
          if (cornerY === "T") y += h - targetH;
          h = targetH;
          if (h < minHeight) {
            const adjH = minHeight;
            const adjW = Math.round(adjH * aspectRatio);
            if (cornerX === "L") x -= adjW - w;
            if (cornerY === "T") y -= adjH - h;
            w = adjW;
            h = adjH;
          }
        }

        dispatch({
          type: "TRANSFORM_NODE",
          id,
          position: { x: Math.round(x), y: Math.round(y) },
          size: { width: Math.round(w), height: Math.round(h) },
        });
      }

      function onPointerMove(e2: PointerEvent) {
        const dx = e2.clientX - startMx;
        const dy = e2.clientY - startMy;
        if (!activated) {
          if (Math.abs(dx) < MOVE_THRESHOLD && Math.abs(dy) < MOVE_THRESHOLD) return;
          activated = true;
        }
        pendingDx = dx / renderScale;
        pendingDy = dy / renderScale;
        if (rafId === 0) {
          rafId = requestAnimationFrame(commit);
        }
      }

      function onPointerUp() {
        if (rafId !== 0) {
          cancelAnimationFrame(rafId);
          commit();
        }
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      }

      e.stopPropagation();
      e.preventDefault();
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    }

    el.addEventListener("pointerdown", onPointerDown);
    return () => el.removeEventListener("pointerdown", onPointerDown);
  }, [ref, id, minWidth, minHeight, aspectRatio, dispatch, enabled]);
}
