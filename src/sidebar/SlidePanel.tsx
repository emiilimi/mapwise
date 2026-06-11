import { useEffect, useMemo, useState } from "react";
import { useMap, useStore } from "../state/store";
import { useTool } from "../hooks/useTool";
import { getOrderedSlides, type OrderedSlide } from "../present/slideOrder";
import { splitSteps } from "../present/stepSplitter";
import { stripPositionSyntax } from "../lib/positionedImages";
import { SafeMarkdown } from "../lib/SafeMarkdown";
import { DEFAULT_SLIDE_TEXT_SIZE, parseFrontmatter } from "../lib/frontmatter";

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

interface PanelEntry {
  entry: OrderedSlide;
  placed: boolean;
}

export function SlidePanel() {
  const map = useMap();
  const { dispatch } = useStore();
  const { focusNode } = useTool();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Plasserte slides (på kartet) + tray (uplasserte), sortert sammen på
  // slide-nummer. Tray-slides uten nummer havner sist.
  const entries = useMemo<PanelEntry[]>(() => {
    const placed: PanelEntry[] = getOrderedSlides(map).map((entry) => ({
      entry,
      placed: true,
    }));
    const tray: PanelEntry[] = map.tray.map((node) => {
      const fm = parseFrontmatter(node.markdown);
      return {
        placed: false,
        entry: {
          node,
          slide: fm.slide ?? Number.POSITIVE_INFINITY,
          thumbnail: fm.thumbnail,
          summary: fm.summary,
          body: fm.body,
        },
      };
    });
    return [...placed, ...tray].sort((a, b) => a.entry.slide - b.entry.slide);
  }, [map]);

  const slides = entries;
  const ids = useMemo(() => entries.map((x) => x.entry.node.id), [entries]);
  const trayCount = map.tray.length;

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

      {trayCount > 0 && (
        <div className="flex items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-3 py-1.5">
          <span className="text-xs text-amber-700">
            {trayCount} ikke plassert
          </span>
          <button
            onClick={() => dispatch({ type: "PLACE_ALL_FROM_TRAY" })}
            className="rounded border border-amber-300 bg-white px-2 py-0.5 text-xs text-amber-800 hover:bg-amber-100"
            title="Legg alle uplasserte slides ut på kartet i et rutenett"
          >
            Plasser alle
          </button>
        </div>
      )}

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
          {slides.map(({ entry, placed }, i) => {
            const id = entry.node.id;
            const onFocus = placed ? () => focusNode(id) : undefined;
            const titleHint = placed
              ? "Klikk for å sentrere kartet på denne sliden"
              : "Ikke plassert — dra ut på kartet for å plassere";
            return (
              <li
                key={id}
                onDragOver={(e) => {
                  if (!dragId || dragId === id) return;
                  e.preventDefault();
                  e.stopPropagation();
                  setOverId(id);
                }}
                onDrop={(e) => {
                  if (!dragId) return;
                  e.preventDefault();
                  e.stopPropagation();
                  reorderBefore(dragId, id);
                  setDragId(null);
                  setOverId(null);
                }}
                className={
                  // content-visibility: rader utenfor scrollporten layoutes/
                  // paintes ikke — viktig for store, bildetunge kart.
                  "rounded [content-visibility:auto] [contain-intrinsic-size:auto_170px] " +
                  (overId === id ? "ring-2 ring-blue-400 ring-offset-1 " : "") +
                  (!placed ? "opacity-90" : "")
                }
              >
                <div className="flex items-center gap-1.5">
                  <span
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(SLIDE_DND_MIME, id);
                      e.dataTransfer.setData("text/plain", id);
                      e.dataTransfer.effectAllowed = "move";
                      setDragId(id);
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
                    onCommit={(n) => moveToPosition(id, n)}
                  />
                  <button
                    onClick={onFocus}
                    className="min-w-0 flex-1 truncate text-left text-xs text-neutral-600 hover:text-neutral-900"
                    title={titleHint}
                  >
                    {entry.thumbnail ??
                      (Number.isFinite(entry.slide)
                        ? `Slide ${entry.slide}`
                        : "Slide")}
                  </button>
                  {!placed && (
                    <span className="shrink-0 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-medium text-amber-700">
                      ny
                    </span>
                  )}
                </div>
                <button
                  onClick={onFocus}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(SLIDE_DND_MIME, id);
                    e.dataTransfer.setData("text/plain", id);
                    e.dataTransfer.effectAllowed = "move";
                    setDragId(id);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverId(null);
                  }}
                  className="group mt-1 block rounded"
                  title={titleHint}
                >
                  <div className="rounded ring-offset-1 group-hover:ring-2 group-hover:ring-blue-400">
                    <SlidePreview entry={entry} />
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}
