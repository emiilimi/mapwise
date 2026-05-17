import { StoreProvider, useMap, useStore } from "./state/store";
import { newId } from "./lib/id";
import { DEFAULT_SLIDE_MARKDOWN, DEFAULT_SLIDE_SIZE } from "./types";

// Midlertidig test-UI for Steg 2. Erstattes med React Flow-canvas i Steg 3.
function StoreDevPanel() {
  const map = useMap();
  const { dispatch, undo, redo, canUndo, canRedo } = useStore();

  return (
    <div className="flex h-screen w-screen flex-col bg-neutral-50 text-neutral-800">
      <header className="border-b border-neutral-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold">MapShow &mdash; Steg 2 devpanel</h1>
        <p className="text-xs text-neutral-500">
          Test av reducer-store med undo/redo. Erstattes i Steg 3.
        </p>
      </header>

      <div className="flex items-center gap-2 border-b border-neutral-200 bg-white px-6 py-3 text-sm">
        <button
          className="rounded border border-neutral-300 bg-white px-3 py-1 hover:bg-neutral-100"
          onClick={() =>
            dispatch({
              type: "ADD_NODE",
              node: {
                type: "slide",
                id: newId(),
                position: { x: 100 + map.nodes.length * 40, y: 100 },
                size: DEFAULT_SLIDE_SIZE,
                markdown: DEFAULT_SLIDE_MARKDOWN,
              },
            })
          }
        >
          + Slide
        </button>
        <button
          className="rounded border border-neutral-300 bg-white px-3 py-1 hover:bg-neutral-100"
          onClick={() =>
            dispatch({
              type: "ADD_NODE",
              node: {
                type: "text",
                id: newId(),
                position: { x: 200, y: 300 },
                content: "Tekstnotat",
              },
            })
          }
        >
          + Tekst
        </button>
        <button
          disabled={!canUndo}
          className="rounded border border-neutral-300 bg-white px-3 py-1 hover:bg-neutral-100 disabled:opacity-40"
          onClick={undo}
        >
          Angre
        </button>
        <button
          disabled={!canRedo}
          className="rounded border border-neutral-300 bg-white px-3 py-1 hover:bg-neutral-100 disabled:opacity-40"
          onClick={redo}
        >
          Gj&oslash;r om
        </button>
        <span className="ml-4 text-neutral-500">
          {map.nodes.length} noder &middot; {map.edges.length} edges
        </span>
      </div>

      <pre className="flex-1 overflow-auto bg-white p-4 font-mono text-xs">
        {JSON.stringify(map, null, 2)}
      </pre>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <StoreDevPanel />
    </StoreProvider>
  );
}
