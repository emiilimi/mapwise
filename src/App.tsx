import { useEffect } from "react";
import { Canvas } from "./canvas/Canvas";
import { StoreProvider, useMap, useStore } from "./state/store";
import { newId } from "./lib/id";
import { DEFAULT_SLIDE_MARKDOWN, DEFAULT_SLIDE_SIZE } from "./types";

// Midlertidig seed for Steg 3. Erstattes når åpne-fil/ny-fil kommer på plass.
function useSeed() {
  const { state, dispatch } = useStore();
  useEffect(() => {
    if (state.present.nodes.length > 0) return;
    const a = newId();
    const b = newId();
    dispatch({
      type: "ADD_NODE",
      node: {
        type: "slide",
        id: a,
        position: { x: 0, y: 0 },
        size: DEFAULT_SLIDE_SIZE,
        markdown: `---\nslide: 1\nthumbnail: Start\n---\n\n# Velkommen\n\nDette er **MapShow**.`,
      },
    });
    dispatch({
      type: "ADD_NODE",
      node: {
        type: "slide",
        id: b,
        position: { x: 420, y: 0 },
        size: DEFAULT_SLIDE_SIZE,
        markdown: DEFAULT_SLIDE_MARKDOWN,
      },
    });
    dispatch({
      type: "ADD_NODE",
      node: {
        type: "text",
        id: newId(),
        position: { x: 200, y: 280 },
        content: "Tekstnotat på kartet",
      },
    });
    dispatch({ type: "ADD_EDGE", edge: { id: newId(), from: a, to: b } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function DevToolbar() {
  const map = useMap();
  const { dispatch, undo, redo, canUndo, canRedo } = useStore();
  return (
    <div className="flex items-center gap-2 border-b border-neutral-200 bg-white px-4 py-2 text-sm">
      <strong className="mr-2">MapShow</strong>
      <button
        className="rounded border border-neutral-300 px-2 py-0.5 hover:bg-neutral-100"
        onClick={() =>
          dispatch({
            type: "ADD_NODE",
            node: {
              type: "slide",
              id: newId(),
              position: { x: 100 + map.nodes.length * 30, y: 400 },
              size: DEFAULT_SLIDE_SIZE,
              markdown: DEFAULT_SLIDE_MARKDOWN,
            },
          })
        }
      >
        + Slide
      </button>
      <button
        disabled={!canUndo}
        className="rounded border border-neutral-300 px-2 py-0.5 hover:bg-neutral-100 disabled:opacity-40"
        onClick={undo}
      >
        Angre
      </button>
      <button
        disabled={!canRedo}
        className="rounded border border-neutral-300 px-2 py-0.5 hover:bg-neutral-100 disabled:opacity-40"
        onClick={redo}
      >
        Gj&oslash;r om
      </button>
      <span className="ml-auto text-xs text-neutral-500">
        Steg 3 &mdash; midlertidig dev-toolbar
      </span>
    </div>
  );
}

function Shell() {
  useSeed();
  return (
    <div className="flex h-screen w-screen flex-col">
      <DevToolbar />
      <div className="flex-1">
        <Canvas />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
