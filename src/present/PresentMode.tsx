import { useEffect, useMemo, useState } from "react";
import { useTool } from "../hooks/useTool";
import { useMap } from "../state/store";
import { ExploreView } from "./ExploreView";
import { ExpandedSlide } from "./ExpandedSlide";
import { PresenterView } from "./PresenterView";
import { getOrderedSlides } from "./slideOrder";

interface Props {
  // I viewer-bygget skjuler vi "Tilbake"-knappen siden det ikke finnes
  // noen editor å vende tilbake til.
  embedded?: boolean;
}

export function PresentMode({ embedded = false }: Props = {}) {
  const { presentMode, closePresent, setPresentMode } = useTool();
  const [expandedSlide, setExpandedSlide] = useState<string | null>(null);

  // Markér <body> så vi kan style hover-scale globalt kun i present-modus.
  useEffect(() => {
    if (presentMode === "off") return;
    document.body.dataset.present = "true";
    return () => {
      delete document.body.dataset.present;
    };
  }, [presentMode]);

  // Reset valgt slide når vi bytter til/fra utforsk-modus.
  useEffect(() => {
    setExpandedSlide(null);
  }, [presentMode]);

  const map = useMap();
  const ordered = useMemo(() => getOrderedSlides(map), [map]);

  // Piltaster navigerer mellom slides i utforsk-modus mens en slide er åpen.
  // Vi bruker presentasjonsrekkefølgen (sortert på `slide:`-feltet); slides
  // uten gyldig slide-nummer er ikke med i listen og kan ikke navigeres til
  // herfra (lukker man ekspandert visning kan man fortsatt klikke dem).
  useEffect(() => {
    if (presentMode !== "explore" || !expandedSlide) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const idx = ordered.findIndex((s) => s.node.id === expandedSlide);
      if (idx < 0) return;
      const next = e.key === "ArrowRight" ? idx + 1 : idx - 1;
      if (next < 0 || next >= ordered.length) return;
      e.preventDefault();
      setExpandedSlide(ordered[next].node.id);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [presentMode, expandedSlide, ordered]);

  if (presentMode === "off") return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white">
      {/* Topplinje */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center gap-2 border-b border-neutral-200 bg-white/90 px-4 py-2 backdrop-blur">
        <span className="text-sm font-semibold">MapShow</span>
        <div className="ml-4 flex overflow-hidden rounded border border-neutral-300 text-xs">
          <button
            onClick={() => setPresentMode("explore")}
            className={
              "px-3 py-1 " +
              (presentMode === "explore"
                ? "bg-blue-600 text-white"
                : "bg-white text-neutral-700 hover:bg-neutral-100")
            }
          >
            Utforsk
          </button>
          <button
            onClick={() => setPresentMode("presenter")}
            className={
              "px-3 py-1 " +
              (presentMode === "presenter"
                ? "bg-blue-600 text-white"
                : "bg-white text-neutral-700 hover:bg-neutral-100")
            }
          >
            Presenter
          </button>
        </div>
        {!embedded && (
          <button
            onClick={closePresent}
            className="ml-auto rounded px-2 py-1 text-sm hover:bg-neutral-100"
            title="Tilbake til editor (Esc)"
          >
            ✕ Tilbake
          </button>
        )}
      </div>

      <div className="absolute inset-0 pt-11">
        {presentMode === "explore" && (
          <ExploreView onSlideClick={(id) => setExpandedSlide(id)} />
        )}
        {presentMode === "presenter" && <PresenterView />}
      </div>

      {expandedSlide && (
        <ExpandedSlide
          slideId={expandedSlide}
          onClose={() => setExpandedSlide(null)}
        />
      )}
    </div>
  );
}
