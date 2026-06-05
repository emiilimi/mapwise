import { useMemo } from "react";
import { useMap } from "../state/store";
import { useTool } from "../hooks/useTool";
import { getOrderedSlides, type OrderedSlide } from "../present/slideOrder";
import { splitSteps } from "../present/stepSplitter";
import { stripPositionSyntax } from "../lib/positionedImages";
import { SafeMarkdown } from "../lib/SafeMarkdown";
import { DEFAULT_SLIDE_TEXT_SIZE } from "../lib/frontmatter";

const PREVIEW_W = 200;

// Flytende ‹/›-knapp som alltid er synlig, slår panelet av/på.
export function SidebarToggle() {
  const { showSidebar, toggleSidebar } = useTool();
  return (
    <button
      onClick={toggleSidebar}
      title={showSidebar ? "Skjul slide-panel" : "Vis slide-panel"}
      className="absolute left-2 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-600 shadow hover:bg-neutral-100"
    >
      {showSidebar ? "‹" : "›"}
    </button>
  );
}

function SlidePreview({ entry }: { entry: OrderedSlide }) {
  const { node } = entry;
  // Hooks må kjøre ubetinget før eventuelle tidlige returns.
  const previewBody = useMemo(
    () => stripPositionSyntax(splitSteps(entry.body).join("\n\n")),
    [entry.body],
  );

  if (node.type === "image") {
    const ratio = node.size.height / node.size.width || 0.625;
    return (
      <div
        className="overflow-hidden rounded border border-neutral-200 bg-white"
        style={{ width: PREVIEW_W, height: PREVIEW_W * ratio }}
      >
        <img
          src={node.src}
          alt={node.alt ?? ""}
          className="h-full w-full object-contain"
          draggable={false}
        />
      </div>
    );
  }

  // Slide-node: skaler ned en full-størrelse render til preview-bredden.
  const w = node.size.width;
  const h = node.size.height;
  const scale = PREVIEW_W / w;
  return (
    <div
      className="relative overflow-hidden rounded border border-neutral-200 bg-white"
      style={{ width: PREVIEW_W, height: h * scale }}
    >
      <div
        className="markdown-body absolute inset-0 overflow-hidden p-3 leading-snug"
        style={{
          width: w,
          height: h,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          fontSize: `${DEFAULT_SLIDE_TEXT_SIZE}px`,
          pointerEvents: "none",
        }}
      >
        <SafeMarkdown>{previewBody}</SafeMarkdown>
      </div>
    </div>
  );
}

export function SlidePanel() {
  const map = useMap();
  const { focusNode } = useTool();
  const slides = useMemo(() => getOrderedSlides(map), [map]);

  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-neutral-200 bg-neutral-50">
      <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2">
        <span className="text-sm font-semibold">Slides</span>
        <span className="text-xs text-neutral-400">{slides.length}</span>
      </div>

      {slides.length === 0 ? (
        <div className="p-4 text-xs text-neutral-400">
          Ingen slides ennå. Lag en slide-boks (S) eller importer en presentasjon.
        </div>
      ) : (
        <ol className="flex-1 space-y-3 overflow-y-auto p-3">
          {slides.map((entry, i) => (
            <li key={entry.node.id}>
              <button
                onClick={() => focusNode(entry.node.id)}
                className="group flex w-full flex-col items-start gap-1 rounded text-left"
                title="Klikk for å sentrere kartet på denne sliden"
              >
                <div className="flex w-full items-center gap-2">
                  <span className="w-5 shrink-0 text-right text-xs font-medium text-neutral-400">
                    {i + 1}
                  </span>
                  <span className="truncate text-xs text-neutral-600">
                    {entry.thumbnail ?? `Slide ${entry.slide}`}
                  </span>
                </div>
                <div className="ml-7 ring-offset-1 group-hover:ring-2 group-hover:ring-blue-400 rounded">
                  <SlidePreview entry={entry} />
                </div>
              </button>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
