import { useEffect, useState } from "react";
import { useTool } from "../hooks/useTool";
import { ExploreView } from "./ExploreView";
import { ExpandedSlide } from "./ExpandedSlide";
import { PresenterView } from "./PresenterView";

export function PresentMode() {
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
        <button
          onClick={closePresent}
          className="ml-auto rounded px-2 py-1 text-sm hover:bg-neutral-100"
          title="Tilbake til editor (Esc)"
        >
          ✕ Tilbake
        </button>
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
