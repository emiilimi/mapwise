import { useEffect, useMemo, useState } from "react";
import { useMap, useStore } from "../state/store";
import { useTool } from "../hooks/useTool";
import { getOrderedSlides, type OrderedSlide } from "../present/slideOrder";
import { splitSteps } from "../present/stepSplitter";
import { stripPositionSyntax } from "../lib/positionedImages";
import { SafeMarkdown } from "../lib/SafeMarkdown";
import { DEFAULT_SLIDE_TEXT_SIZE } from "../lib/frontmatter";

const PREVIEW_W = 200;

// MIME for drag-and-drop av en slide ut av panelet (gjenbrukes av Canvas i
// steg 4 for å plassere tray-slides).
export const SLIDE_DND_MIME = "application/x-mapwise-slide";

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

// Liten nummer-input som committer på Enter/blur. Stopper drag/klikk fra å
// boble til rad-knappen.
function PositionInput({
  value,
  max,
  onCommit,
}: {
  value: number;
  max: number;
  onCommit: (n: number) => void;
}) {
  const [v, setV] = useState(String(value));
  useEffect(() => setV(String(value)), [value]);
  const commit = () => {
    const n = parseInt(v, 10);
    if (Number.isFinite(n) && n !== value) onCommit(n);
    else setV(String(value));
  };
  return (
    <input
      type="number"
      min={1}
      max={max}
      value={v}
      draggable={false}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        else if (e.key === "Escape") {
          setV(String(value));
          e.currentTarget.blur();
        }
      }}
      title="Endre rekkefølge — skriv inn posisjon"
      className="w-8 rounded border border-neutral-200 bg-white px-1 py-0.5 text-center text-xs text-neutral-700 outline-none focus:border-blue-400"
    />
  );
}

export function SlidePanel() {
  const map = useMap();
  const { dispatch } = useStore();
  const { focusNode } = useTool();
  const slides = useMemo(() => getOrderedSlides(map), [map]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const ids = useMemo(() => slides.map((s) => s.node.id), [slides]);

  function reorderBefore(moved: string, targetId: string | null) {
    if (!moved) return;
    const without = ids.filter((id) => id !== moved);
    const idx = targetId === null ? without.length : without.indexOf(targetId);
    without.splice(idx < 0 ? without.length : idx, 0, moved);
    dispatch({ type: "REORDER_SLIDES", order: without });
  }

  function moveToPosition(id: string, pos1Based: number) {
    const without = ids.filter((x) => x !== id);
    const clamped = Math.max(1, Math.min(without.length + 1, pos1Based));
    without.splice(clamped - 1, 0, id);
    dispatch({ type: "REORDER_SLIDES", order: without });
  }

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
        <ol
          className="flex-1 space-y-3 overflow-y-auto p-3"
          onDragOver={(e) => {
            if (dragId) e.preventDefault();
          }}
          onDrop={(e) => {
            if (!dragId) return;
            e.preventDefault();
            reorderBefore(dragId, null);
            setDragId(null);
            setOverId(null);
          }}
        >
          {slides.map((entry, i) => (
            <li
              key={entry.node.id}
              onDragOver={(e) => {
                if (!dragId || dragId === entry.node.id) return;
                e.preventDefault();
                e.stopPropagation();
                setOverId(entry.node.id);
              }}
              onDrop={(e) => {
                if (!dragId) return;
                e.preventDefault();
                e.stopPropagation();
                reorderBefore(dragId, entry.node.id);
                setDragId(null);
                setOverId(null);
              }}
              className={
                "rounded " +
                (overId === entry.node.id
                  ? "ring-2 ring-blue-400 ring-offset-1"
                  : "")
              }
            >
              <div className="flex items-center gap-1.5">
                <span
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(SLIDE_DND_MIME, entry.node.id);
                    e.dataTransfer.setData("text/plain", entry.node.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDragId(entry.node.id);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverId(null);
                  }}
                  title="Dra for å endre rekkefølge (eller dra ut på kartet)"
                  className="cursor-grab select-none px-0.5 text-neutral-400 hover:text-neutral-600"
                >
                  ⠿
                </span>
                <PositionInput
                  value={i + 1}
                  max={slides.length}
                  onCommit={(n) => moveToPosition(entry.node.id, n)}
                />
                <button
                  onClick={() => focusNode(entry.node.id)}
                  className="min-w-0 flex-1 truncate text-left text-xs text-neutral-600 hover:text-neutral-900"
                  title="Klikk for å sentrere kartet på denne sliden"
                >
                  {entry.thumbnail ?? `Slide ${entry.slide}`}
                </button>
              </div>
              <button
                onClick={() => focusNode(entry.node.id)}
                className="group mt-1 block rounded"
                title="Klikk for å sentrere kartet på denne sliden"
              >
                <div className="rounded ring-offset-1 group-hover:ring-2 group-hover:ring-blue-400">
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
